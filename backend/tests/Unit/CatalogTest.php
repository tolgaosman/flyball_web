<?php

namespace Tests\Unit;

use App\Flyball\Catalog\ClubCatalog;
use App\Flyball\Catalog\CompetitionCatalog;
use App\Flyball\Catalog\CountryCatalog;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    public function test_has_exactly_seven_leagues(): void
    {
        $this->assertCount(7, ClubCatalog::leagues());
    }

    public function test_every_club_name_is_unique(): void
    {
        $names = ClubCatalog::names();
        $this->assertCount(count($names), array_unique($names));
        $this->assertCount(133, $names);
    }

    public function test_every_league_has_at_least_12_clubs(): void
    {
        foreach (ClubCatalog::leagues() as $league) {
            $this->assertGreaterThanOrEqual(12, count(ClubCatalog::clubsInLeague($league)), $league);
        }
    }

    public function test_by_name_resolves_the_declared_league(): void
    {
        $this->assertSame('Süper Lig', ClubCatalog::byName('Galatasaray')['league']);
        $this->assertSame('Süper Lig', ClubCatalog::leagueOf('Galatasaray'));
        $this->assertNull(ClubCatalog::byName('Narnia FC'));
    }

    public function test_countries_are_unique_and_wide(): void
    {
        $names = CountryCatalog::names();
        $this->assertCount(count($names), array_unique($names));
        $this->assertCount(115, $names);
    }

    public function test_flag_url(): void
    {
        $this->assertSame('https://flagcdn.com/w160/fr.png', CountryCatalog::flagUrl('France'));
        $this->assertSame('https://flagcdn.com/w160/gb-eng.png', CountryCatalog::flagUrl('England'));
        $this->assertNull(CountryCatalog::flagUrl('Narnia'));
    }

    public function test_competition_ids(): void
    {
        $this->assertSame(4328, CompetitionCatalog::byName('Premier League')['sportsDbLeagueId']);
        $this->assertNull(CompetitionCatalog::byName('Copa America')['sportsDbLeagueId']);
    }
}
