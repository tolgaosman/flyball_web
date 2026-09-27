<?php

namespace App\Services;

use App\Flyball\Ai\AnswerFinder;
use App\Flyball\Ai\BoardBuilder;
use App\Flyball\Ai\GeminiQuotaExceededException;
use App\Flyball\Ai\RoundPicker;
use App\Flyball\Model\AnswerResult;
use App\Flyball\Model\Board;
use App\Flyball\Model\Round;
use App\Flyball\Model\RoundKind;
use App\Jobs\TopUpBuffer;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;

/**
 * Cache-then-AI. Concurrent identical searches share one Gemini call (a cache
 * lock stands in for the Dart in-flight future map across PHP workers), and a
 * small buffer of ready rounds/boards is kept topped up by a queued job so
 * the common case is "already ready", not "wait for Gemini".
 */
final class FlyballService
{
    private const LOCK_SECONDS = 150;

    private const LOCK_WAIT_SECONDS = 140;

    private const XOX_SHARE_SECONDS = 120;

    public function __construct(
        private readonly AiCacheStore $cache,
        private readonly AnswerFinder $answerFinder,
        private readonly BoardBuilder $boardBuilder,
        private readonly RoundPicker $roundPicker,
        private readonly int $bufferTarget,
    ) {}

    /** @throws GeminiQuotaExceededException */
    public function answersForTwoTeam(string $teamA, string $teamB): ?AnswerResult
    {
        return $this->cachedAnswers(RoundKind::TwoTeam, $teamA, $teamB, "Played for {$teamA}", "Played for {$teamB}");
    }

    /** @throws GeminiQuotaExceededException */
    public function answersForTeamCountry(string $team, string $country): ?AnswerResult
    {
        return $this->cachedAnswers(RoundKind::TeamCountry, $team, $country, "Played for {$team}", "{$country} nationality");
    }

    /**
     * XOX cell answers are not cached (the board already carries a preview);
     * the short-lived entry only lets concurrent waiters share one call.
     *
     * @throws GeminiQuotaExceededException
     */
    public function answersForFactors(string $condition1, string $condition2): ?AnswerResult
    {
        $shareKey = 'flyball:xox:'.sha1("{$condition1}::{$condition2}");

        return $this->deduped(
            $shareKey,
            fn () => Cache::get($shareKey),
            fn () => $this->answerFinder->search($condition1, $condition2),
            fn (AnswerResult $r) => Cache::put($shareKey, $r, self::XOX_SHARE_SECONDS),
        );
    }

    /** @throws GeminiQuotaExceededException */
    public function nextRound(RoundKind $kind): ?Round
    {
        $buffered = $this->cache->takeBufferedRound($kind);
        $this->scheduleTopUp($kind->value);
        if ($buffered !== null) {
            return $buffered;
        }

        return $this->buildRound($kind);
    }

    /** @throws GeminiQuotaExceededException */
    public function nextBoard(): ?Board
    {
        $buffered = $this->cache->takeBufferedBoard();
        $this->scheduleTopUp(TopUpBuffer::BOARDS);
        if ($buffered !== null) {
            return $buffered;
        }

        return $this->boardBuilder->buildBoard();
    }

    /** Fills one buffer up to the target; stops on a failed build or the quota, never spins. */
    public function topUp(string $buffer): void
    {
        try {
            if ($buffer === TopUpBuffer::BOARDS) {
                for ($count = $this->cache->bufferedBoardCount(); $count < $this->bufferTarget; $count++) {
                    $board = $this->boardBuilder->buildBoard();
                    if ($board === null) {
                        return;
                    }
                    $this->cache->pushBoard($board);
                }

                return;
            }

            $kind = RoundKind::from($buffer);
            for ($count = $this->cache->bufferedRoundCount($kind); $count < $this->bufferTarget; $count++) {
                $round = $this->buildRound($kind);
                if ($round === null) {
                    return;
                }
                $this->cache->pushRound($round);
            }
        } catch (GeminiQuotaExceededException) {
            // Quota exhausted: stop quietly; the next request surfaces the 429.
        }
    }

    private function buildRound(RoundKind $kind): ?Round
    {
        return $kind === RoundKind::TwoTeam
            ? $this->roundPicker->nextTwoTeamRound()
            : $this->roundPicker->nextTeamCountryRound();
    }

    private function scheduleTopUp(string $buffer): void
    {
        if ($this->bufferTarget > 0) {
            TopUpBuffer::dispatch($buffer);
        }
    }

    private function cachedAnswers(RoundKind $kind, string $a, string $b, string $condition1, string $condition2): ?AnswerResult
    {
        $key = AiCacheStore::keyFor($kind, $a, $b);
        $cached = $this->cache->getAnswer($key);
        if ($cached !== null) {
            return $cached;
        }

        return $this->deduped(
            'flyball:answers:'.sha1($key),
            fn () => $this->cache->getAnswer($key),
            fn () => $this->answerFinder->search($condition1, $condition2),
            fn (AnswerResult $r) => $this->cache->putAnswer($key, $a, $b, $r),
        );
    }

    /**
     * Whoever holds the lock does the search; everyone queued behind it
     * re-reads the stored result instead of calling Gemini again.
     */
    private function deduped(string $lockKey, callable $lookup, callable $search, callable $store): ?AnswerResult
    {
        try {
            return Cache::lock($lockKey, self::LOCK_SECONDS)->block(self::LOCK_WAIT_SECONDS, function () use ($lookup, $search, $store) {
                $ready = $lookup();
                if ($ready !== null) {
                    return $ready;
                }
                $result = $search();
                if ($result !== null) {
                    $store($result);
                }

                return $result;
            });
        } catch (LockTimeoutException) {
            return null;
        }
    }
}
