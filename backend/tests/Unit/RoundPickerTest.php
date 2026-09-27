<?php

namespace Tests\Unit;

use App\Flyball\Ai\AnswerFinder;
use App\Flyball\Ai\GeminiQuotaExceededException;
use App\Flyball\Ai\RoundPicker;
use App\Flyball\Catalog\ClubCatalog;
use App\Flyball\Catalog\CountryCatalog;
use App\Flyball\Model\RoundKind;
use Random\Engine\Mt19937;
use Random\Randomizer;
use Tests\Support\ScriptedTransport as T;
use Tests\TestCase;

class RoundPickerTest extends TestCase
{
    private function picker(T $t): RoundPicker
    {
        return new RoundPicker(new AnswerFinder($t));
    }

    public function test_two_team_round_on_first_successful_draw(): void
    {
        $t = new T([T::players(['Test Player'])]);
        $round = $this->picker($t)->nextTwoTeamRound(new Randomizer(new Mt19937(1)));
        $this->assertSame(RoundKind::TwoTeam, $round->kind);
        $this->assertSame(['Test Player'], $round->answers->players);
        $this->assertNotSame($round->conditionA, $round->conditionB);
        $this->assertContains($round->conditionA, ClubCatalog::names());
        $this->assertSame(2, $t->calls());
        $this->assertStringContainsString("\"Played for {$round->conditionA}\"", $t->prompts[0]);
    }

    public function test_gives_up_after_four_empty_recalls(): void
    {
        $t = new T([T::players([])]);
        $this->assertNull($this->picker($t)->nextTwoTeamRound(new Randomizer(new Mt19937(2))));
        $this->assertSame(4, $t->calls());
    }

    public function test_falls_back_to_first_verified_empty_round(): void
    {
        $t = new T([T::players(['A']), T::players([])]);
        $round = $this->picker($t)->nextTwoTeamRound(new Randomizer(new Mt19937(7)));
        $this->assertSame([], $round->answers->players);
        $this->assertSame(5, $t->calls());
    }

    public function test_team_country_round(): void
    {
        $t = new T([T::players(['Test Player'])]);
        $round = $this->picker($t)->nextTeamCountryRound(new Randomizer(new Mt19937(3)));
        $this->assertSame(RoundKind::TeamCountry, $round->kind);
        $this->assertContains($round->conditionA, ClubCatalog::names());
        $this->assertContains($round->conditionB, CountryCatalog::names());
        $this->assertStringContainsString("\"{$round->conditionB} nationality\"", $t->prompts[0]);
    }

    public function test_quota_aborts_immediately_without_retrying(): void
    {
        $t = new T(['quota']);
        try {
            $this->picker($t)->nextTwoTeamRound(new Randomizer(new Mt19937(4)));
            $this->fail('expected quota exception');
        } catch (GeminiQuotaExceededException) {
            $this->assertSame(1, $t->calls());
        }
    }

    public function test_same_league_weighting_is_roughly_65_percent(): void
    {
        $t = new T([T::players(['P'])]);
        $picker = $this->picker($t);
        $rng = new Randomizer(new Mt19937(9));
        $same = 0;
        for ($i = 0; $i < 400; $i++) {
            $r = $picker->nextTwoTeamRound($rng);
            $same += ClubCatalog::leagueOf($r->conditionA) === ClubCatalog::leagueOf($r->conditionB) ? 1 : 0;
        }
        $this->assertGreaterThan(0.6, $same / 400);
        $this->assertLessThan(0.8, $same / 400);
    }
}
