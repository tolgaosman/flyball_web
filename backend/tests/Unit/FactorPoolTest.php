<?php

namespace Tests\Unit;

use App\Flyball\Model\Factor;
use App\Flyball\Model\FactorPool;
use App\Flyball\Model\FactorType;
use Random\Engine\Mt19937;
use Random\Randomizer;
use Tests\TestCase;

class FactorPoolTest extends TestCase
{
    public function test_pool_has_every_factor(): void
    {
        $this->assertCount(267, FactorPool::allFactors());
    }

    public function test_pick_axis_valid_six_returns_six_unique_valid_factors(): void
    {
        $rng = new Randomizer(new Mt19937(1));
        for ($i = 0; $i < 200; $i++) {
            $axes = FactorPool::pickAxisValidSix($rng);
            $this->assertCount(3, $axes['rows']);
            $this->assertCount(3, $axes['columns']);
            $keys = array_map(fn (Factor $f) => $f->type->value.':'.$f->value, [...$axes['rows'], ...$axes['columns']]);
            $this->assertCount(6, array_unique($keys));
            $this->assertTrue(FactorPool::axesAreValid($axes['rows'], $axes['columns']));
        }
    }

    public function test_rejects_nationality_vs_nationality_across_axes(): void
    {
        $rows = [$this->nation('France'), $this->team('Arsenal'), $this->team('Chelsea')];
        $columns = [$this->nation('Spain'), $this->team('Roma'), $this->team('Lazio')];
        $this->assertFalse(FactorPool::axesAreValid($rows, $columns));
    }

    public function test_allows_two_nationalities_on_the_same_axis(): void
    {
        $rows = [$this->nation('France'), $this->nation('Spain'), $this->team('Chelsea')];
        $columns = [$this->team('Arsenal'), $this->team('Roma'), $this->team('Lazio')];
        $this->assertTrue(FactorPool::axesAreValid($rows, $columns));
    }

    public function test_rejects_euros_and_copa_america_on_the_same_board(): void
    {
        $rows = [$this->intl('Euros'), $this->team('Arsenal'), $this->team('Chelsea')];
        $columns = [$this->intl('Copa America'), $this->team('Roma'), $this->team('Lazio')];
        $this->assertFalse(FactorPool::axesAreValid($rows, $columns));

        $sameAxis = [$this->intl('Euros'), $this->intl('Copa America'), $this->team('Chelsea')];
        $this->assertFalse(FactorPool::axesAreValid($sameAxis, [$this->team('Roma'), $this->team('Lazio'), $this->team('Arsenal')]));
    }

    public function test_cell_possibility_uses_tournament_winners(): void
    {
        $worldCup = $this->intl('World Cup');
        $this->assertFalse(FactorPool::isCellPossible($this->nation('USA'), $worldCup));
        $this->assertTrue(FactorPool::isCellPossible($this->nation('Brazil'), $worldCup));
        $this->assertTrue(FactorPool::isCellPossible($worldCup, $this->nation('Brazil')));
        $this->assertTrue(FactorPool::isCellPossible($this->nation('USA'), $this->intl('Champions League')));
        $this->assertFalse(FactorPool::isCellPossible($this->nation('Brazil'), $this->intl('Euros')));
    }

    private function nation(string $name): Factor
    {
        return new Factor(FactorType::Nationality, $name, $name);
    }

    private function team(string $name): Factor
    {
        return new Factor(FactorType::Team, "Played for {$name}", $name);
    }

    private function intl(string $name): Factor
    {
        return new Factor(FactorType::WonInternational, "Won {$name}", $name);
    }
}
