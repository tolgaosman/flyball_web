<?php

namespace Tests\Unit;

use App\Flyball\Ai\Prompts;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PromptsTest extends TestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_date_anchoring(): void
    {
        Carbon::setTestNow('2026-03-14 10:00:00');
        $this->assertSame('2026-03-14', Prompts::todayIso());
        $this->assertSame('January 2026 transfer window', Prompts::currentWindowLabel());

        Carbon::setTestNow('2026-06-01 10:00:00');
        $this->assertSame('summer 2026 transfer window', Prompts::currentWindowLabel());
    }

    public function test_verify_embeds_unescaped_candidates(): void
    {
        $prompt = Prompts::verify(['Mesut Özil', 'A/B'], 'Played for Arsenal', 'Germany nationality');
        $this->assertStringContainsString('CANDIDATES: ["Mesut Özil","A/B"]', $prompt);
        $this->assertStringContainsString("1. \"Played for Arsenal\"\n2. \"Germany nationality\"", $prompt);
    }

    public function test_board_cells_are_numbered_row_major(): void
    {
        $prompt = Prompts::boardCells(['R0', 'R1', 'R2'], ['C0', 'C1', 'C2']);
        $this->assertStringContainsString("1. \"R0\" AND \"C0\"\n2. \"R0\" AND \"C1\"", $prompt);
        $this->assertStringContainsString('9. "R2" AND "C2"', $prompt);
    }
}
