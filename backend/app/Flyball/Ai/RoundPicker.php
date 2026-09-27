<?php

namespace App\Flyball\Ai;

use App\Flyball\Catalog\ClubCatalog;
use App\Flyball\Catalog\CountryCatalog;
use App\Flyball\Model\Round;
use App\Flyball\Model\RoundKind;
use Random\Randomizer;

/**
 * Draws party rounds and only hands out one an AnswerFinder search actually
 * backed, so revealing its answers is instant. A quota hit aborts the loop
 * immediately (the exception is not caught here).
 */
final class RoundPicker
{
    private const MAX_ATTEMPTS = 4;

    private const SAME_LEAGUE_WEIGHT = 0.65;

    public function __construct(private readonly AnswerFinder $answerFinder) {}

    /** @throws GeminiQuotaExceededException */
    public function nextTwoTeamRound(?Randomizer $rng = null): ?Round
    {
        $rng ??= new Randomizer;

        return $this->pick(RoundKind::TwoTeam, function () use ($rng) {
            [$a, $b] = $this->pickClubPair($rng);

            return [$a, $b, "Played for {$a}", "Played for {$b}"];
        });
    }

    /** @throws GeminiQuotaExceededException */
    public function nextTeamCountryRound(?Randomizer $rng = null): ?Round
    {
        $rng ??= new Randomizer;

        return $this->pick(RoundKind::TeamCountry, function () use ($rng) {
            $clubs = ClubCatalog::names();
            $countries = CountryCatalog::names();
            $club = $clubs[$rng->getInt(0, count($clubs) - 1)];
            $country = $countries[$rng->getInt(0, count($countries) - 1)];

            return [$club, $country, "Played for {$club}", "{$country} nationality"];
        });
    }

    /** @param callable(): array{string, string, string, string} $draw */
    private function pick(RoundKind $kind, callable $draw): ?Round
    {
        $fallback = null;
        for ($attempt = 0; $attempt < self::MAX_ATTEMPTS; $attempt++) {
            [$a, $b, $condition1, $condition2] = $draw();
            $result = $this->answerFinder->search($condition1, $condition2);
            if ($result === null) {
                continue;
            }
            $round = new Round($kind, $a, $b, $result);
            if ($result->players !== []) {
                return $round;
            }
            $fallback ??= $round;
        }

        return $fallback;
    }

    /** @return array{string, string} — 65% of the time both from one league (they share far more players) */
    private function pickClubPair(Randomizer $rng): array
    {
        if ($rng->nextFloat() < self::SAME_LEAGUE_WEIGHT) {
            $leagues = ClubCatalog::leagues();
            $clubs = ClubCatalog::clubsInLeague($leagues[$rng->getInt(0, count($leagues) - 1)]);
            if (count($clubs) >= 2) {
                $shuffled = $rng->shuffleArray($clubs);

                return [$shuffled[0], $shuffled[1]];
            }
        }
        $all = ClubCatalog::names();
        $a = $all[$rng->getInt(0, count($all) - 1)];
        do {
            $b = $all[$rng->getInt(0, count($all) - 1)];
        } while ($b === $a);

        return [$a, $b];
    }
}
