<?php

namespace App\Flyball\Catalog;

final class CompetitionCatalog
{
    /** @return list<array{name: string, sportsDbLeagueId: ?int}> */
    public static function leagues(): array
    {
        return SharedData::load('competitions')['leagues'];
    }

    /** @return list<array{name: string, sportsDbLeagueId: ?int}> */
    public static function internationalTournaments(): array
    {
        return SharedData::load('competitions')['internationalTournaments'];
    }

    public static function byName(string $name): ?array
    {
        foreach ([...self::leagues(), ...self::internationalTournaments()] as $competition) {
            if ($competition['name'] === $name) {
                return $competition;
            }
        }

        return null;
    }
}
