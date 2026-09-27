<?php

namespace App\Flyball\Model;

use App\Flyball\Catalog\ClubCatalog;
use App\Flyball\Catalog\CompetitionCatalog;
use App\Flyball\Catalog\CountryCatalog;
use Random\Randomizer;

/**
 * Every possible XOX factor plus the axis rules that keep all 9 cells
 * askable. Whether a cell actually has an answer is the BoardBuilder's job.
 */
final class FactorPool
{
    private const WORLD_CUP_WINNERS = ['Argentina', 'Brazil', 'France', 'Germany', 'Italy', 'Spain', 'Uruguay', 'England'];

    private const EUROS_WINNERS = ['Germany', 'Spain', 'Italy', 'France', 'Portugal', 'Netherlands', 'Denmark', 'Greece', 'Czechia', 'Russia'];

    private const COPA_AMERICA_WINNERS = ['Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Chile', 'Peru', 'Paraguay'];

    /** @return list<Factor> */
    public static function allFactors(): array
    {
        $factors = [];
        foreach (ClubCatalog::leagues() as $league) {
            $factors[] = new Factor(FactorType::PlayedLeague, "Played in {$league}", $league);
            $factors[] = new Factor(FactorType::WonLeague, "Won {$league}", $league);
        }
        foreach (CompetitionCatalog::internationalTournaments() as $t) {
            $factors[] = new Factor(FactorType::WonInternational, "Won {$t['name']}", $t['name']);
        }
        foreach (ClubCatalog::names() as $team) {
            $factors[] = new Factor(FactorType::Team, "Played for {$team}", $team);
        }
        foreach (CountryCatalog::names() as $country) {
            $factors[] = new Factor(FactorType::Nationality, $country, $country);
        }

        return $factors;
    }

    /** True when $label is the label of some factor in the pool (i.e. a real XOX header). */
    public static function isKnownLabel(string $label): bool
    {
        static $labels = null;
        $labels ??= array_flip(array_map(fn (Factor $f) => $f->label, self::allFactors()));

        return isset($labels[$label]);
    }

    /**
     * Reject-samples six unique factors until the 3/3 split is valid; after
     * $maxAttempts returns an arbitrary split rather than looping forever.
     *
     * @return array{rows: list<Factor>, columns: list<Factor>}
     */
    public static function pickAxisValidSix(Randomizer $rng, int $maxAttempts = 500): array
    {
        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $chosen = self::pickSixUnique($rng);
            $rows = array_slice($chosen, 0, 3);
            $columns = array_slice($chosen, 3, 3);
            if (self::axesAreValid($rows, $columns)) {
                return ['rows' => $rows, 'columns' => $columns];
            }
        }
        $chosen = self::pickSixUnique($rng);

        return ['rows' => array_slice($chosen, 0, 3), 'columns' => array_slice($chosen, 3, 3)];
    }

    /** @return list<Factor> */
    public static function pickSixUnique(Randomizer $rng): array
    {
        return array_slice($rng->shuffleArray(self::allFactors()), 0, 6);
    }

    /**
     * @param  list<Factor>  $rows
     * @param  list<Factor>  $columns
     */
    public static function axesAreValid(array $rows, array $columns): bool
    {
        $any = function (array $factors, callable $predicate): bool {
            foreach ($factors as $factor) {
                if ($predicate($factor)) {
                    return true;
                }
            }

            return false;
        };

        if ($any($rows, fn (Factor $f) => $f->isNationality()) && $any($columns, fn (Factor $f) => $f->isNationality())) {
            return false;
        }
        if ($any($rows, fn (Factor $f) => $f->isInternational()) && $any($columns, fn (Factor $f) => $f->isInternational())) {
            return false;
        }

        $all = [...$rows, ...$columns];
        $hasEuros = $any($all, fn (Factor $f) => $f->isInternational() && $f->value === 'Euros');
        $hasCopa = $any($all, fn (Factor $f) => $f->isInternational() && $f->value === 'Copa America');
        if ($hasEuros && $hasCopa) {
            return false;
        }

        foreach ($rows as $row) {
            foreach ($columns as $column) {
                if (! self::isCellPossible($row, $column)) {
                    return false;
                }
            }
        }

        return true;
    }

    public static function isCellPossible(Factor $a, Factor $b): bool
    {
        if ($a->isNationality() && $b->isInternational()) {
            return self::canNationalityWinTournament($a->value, $b->value);
        }
        if ($b->isNationality() && $a->isInternational()) {
            return self::canNationalityWinTournament($b->value, $a->value);
        }

        return true;
    }

    private static function canNationalityWinTournament(string $nationality, string $tournament): bool
    {
        return match ($tournament) {
            'World Cup' => in_array($nationality, self::WORLD_CUP_WINNERS, true),
            'Euros' => in_array($nationality, self::EUROS_WINNERS, true),
            'Copa America' => in_array($nationality, self::COPA_AMERICA_WINNERS, true),
            default => true,
        };
    }
}
