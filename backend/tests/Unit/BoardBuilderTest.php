<?php

namespace Tests\Unit;

use App\Flyball\Ai\BoardBuilder;
use App\Flyball\Ai\GeminiQuotaExceededException;
use App\Flyball\Model\Factor;
use Random\Engine\Mt19937;
use Random\Randomizer;
use Tests\Support\ScriptedTransport as T;
use Tests\TestCase;

class BoardBuilderTest extends TestCase
{
    private function rng(int $seed): Randomizer
    {
        return new Randomizer(new Mt19937($seed));
    }

    private function filled(?int $emptyIndex = null): array
    {
        return array_map(fn ($i) => $i === $emptyIndex ? [] : ['P'], range(0, 8));
    }

    public function test_solved_board_on_the_first_call(): void
    {
        $t = new T([T::cells($this->filled())]);
        $board = (new BoardBuilder($t))->buildBoard($this->rng(1));
        $this->assertCount(3, $board->rows);
        $this->assertCount(3, $board->columns);
        $this->assertSame(1, $t->calls());
        foreach ($board->cellExamples as $cell) {
            $this->assertNotEmpty($cell);
        }
    }

    public function test_swaps_a_factor_when_a_cell_is_empty(): void
    {
        $t = new T([T::cells($this->filled(0)), T::cells($this->filled())]);
        $board = (new BoardBuilder($t))->buildBoard($this->rng(2));
        $this->assertSame(2, $t->calls());
        foreach ($board->cellExamples as $cell) {
            $this->assertNotEmpty($cell);
        }
    }

    public function test_null_when_unreachable_on_first_attempt(): void
    {
        $this->assertNull((new BoardBuilder(new T([null])))->buildBoard($this->rng(3)));
    }

    public function test_board_with_unresolved_cells_after_three_attempts(): void
    {
        $t = new T([T::cells($this->filled(0))]);
        $board = (new BoardBuilder($t))->buildBoard($this->rng(4));
        $this->assertSame(3, $t->calls());
        $this->assertSame([], $board->cellExamples[0]);
    }

    public function test_failed_retry_keeps_the_axes_that_match_the_last_good_cells(): void
    {
        $t = new T([T::cells($this->filled(0)), null]);
        $board = (new BoardBuilder($t))->buildBoard($this->rng(5));
        $labels = array_map(fn (Factor $f) => $f->label, [...$board->rows, ...$board->columns]);
        foreach ($labels as $label) {
            $this->assertStringContainsString("\"{$label}\"", $t->prompts[0]);
        }
    }

    public function test_quota_propagates(): void
    {
        $this->expectException(GeminiQuotaExceededException::class);
        (new BoardBuilder(new T([T::cells($this->filled(0)), 'quota'])))->buildBoard($this->rng(6));
    }
}
