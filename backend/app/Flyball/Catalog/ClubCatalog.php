<?php

namespace App\Flyball\Catalog;

final class ClubCatalog
{
    /** @return list<string> the seven leagues, in display order */
    public static function leagues(): array
    {
        return SharedData::load('clubs')['leagues'];
    }

    /** @return list<array{name: string, league: string, sportsDbName: string, aliases: list<string>}> */
    public static function all(): array
    {
        return SharedData::load('clubs')['clubs'];
    }

    /** @return list<string> */
    public static function names(): array
    {
        return array_column(self::all(), 'name');
    }

    public static function byName(string $name): ?array
    {
        foreach (self::all() as $club) {
            if ($club['name'] === $name) {
                return $club;
            }
        }

        return null;
    }

    public static function leagueOf(string $name): ?string
    {
        return self::byName($name)['league'] ?? null;
    }

    /** @return list<string> club names in $league, [] for an unknown league */
    public static function clubsInLeague(string $league): array
    {
        return array_values(array_map(
            fn (array $c) => $c['name'],
            array_filter(self::all(), fn (array $c) => $c['league'] === $league),
        ));
    }
}
