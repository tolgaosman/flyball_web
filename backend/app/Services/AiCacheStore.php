<?php

namespace App\Services;

use App\Flyball\Model\AnswerResult;
use App\Flyball\Model\Board;
use App\Flyball\Model\Round;
use App\Flyball\Model\RoundKind;
use Carbon\CarbonInterface;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/**
 * A CACHE of live AI results, never a corpus: answers expire, and buffered
 * rounds/boards are handed out once each (oldest first).
 */
final class AiCacheStore
{
    private function db(): Connection
    {
        return DB::connection('ai_cache');
    }

    /** two-team pairs are order-independent; team+country is not. */
    public static function keyFor(RoundKind $kind, string $conditionA, string $conditionB): string
    {
        if ($kind === RoundKind::TwoTeam) {
            $sorted = [$conditionA, $conditionB];
            sort($sorted, SORT_STRING);

            return "twoTeam:{$sorted[0]}::{$sorted[1]}";
        }

        return "teamCountry:{$conditionA}::{$conditionB}";
    }

    /** Transfer windows (Jan–Feb, Jun–Sep) change squads fast, so answers go stale sooner. */
    public static function ttlMsFor(CarbonInterface $now): int
    {
        $inWindow = in_array($now->month, [1, 2], true) || ($now->month >= 6 && $now->month <= 9);

        return ($inWindow ? 2 : 7) * 24 * 60 * 60 * 1000;
    }

    public function getAnswer(string $cacheKey): ?AnswerResult
    {
        $row = $this->db()->table('answer_cache')->where('cache_key', $cacheKey)->first();
        if ($row === null) {
            return null;
        }
        $now = now();
        if ($now->getTimestampMs() - (int) $row->created_at > self::ttlMsFor($now)) {
            $this->db()->table('answer_cache')->where('cache_key', $cacheKey)->delete();

            return null;
        }

        return new AnswerResult(array_map('strval', json_decode($row->players_json, true)), (bool) $row->verified);
    }

    public function putAnswer(string $cacheKey, string $conditionA, string $conditionB, AnswerResult $result): void
    {
        $this->db()->table('answer_cache')->upsert([
            'cache_key' => $cacheKey,
            'cond_a' => $conditionA,
            'cond_b' => $conditionB,
            'players_json' => json_encode($result->players, JSON_UNESCAPED_UNICODE),
            'verified' => $result->verified,
            'created_at' => now()->getTimestampMs(),
        ], ['cache_key']);
    }

    public function takeBufferedBoard(): ?Board
    {
        $json = $this->take('boards', 'board_json');

        return $json === null ? null : Board::fromArray($json);
    }

    public function pushBoard(Board $board): void
    {
        $this->db()->table('boards')->insert([
            'board_json' => json_encode($board, JSON_UNESCAPED_UNICODE),
            'created_at' => now()->getTimestampMs(),
        ]);
    }

    public function bufferedBoardCount(): int
    {
        return $this->db()->table('boards')->count();
    }

    public function takeBufferedRound(RoundKind $kind): ?Round
    {
        $json = $this->take('rounds', 'round_json', $kind);

        return $json === null ? null : Round::fromArray($json);
    }

    public function pushRound(Round $round): void
    {
        $this->db()->table('rounds')->insert([
            'kind' => $round->kind->value,
            'round_json' => json_encode($round, JSON_UNESCAPED_UNICODE),
            'created_at' => now()->getTimestampMs(),
        ]);
    }

    public function bufferedRoundCount(RoundKind $kind): int
    {
        return $this->db()->table('rounds')->where('kind', $kind->value)->count();
    }

    /** Pops the oldest row atomically, so two concurrent requests never get the same item. */
    private function take(string $table, string $column, ?RoundKind $kind = null): ?array
    {
        return $this->db()->transaction(function () use ($table, $column, $kind) {
            $row = $this->db()->table($table)
                ->when($kind, fn ($q) => $q->where('kind', $kind->value))
                ->orderBy('id')
                ->first();
            if ($row === null) {
                return null;
            }
            $this->db()->table($table)->where('id', $row->id)->delete();

            return json_decode($row->{$column}, true);
        });
    }
}
