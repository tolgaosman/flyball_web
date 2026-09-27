<?php

namespace Tests\Unit;

use App\Flyball\Ai\GeminiParser;
use PHPUnit\Framework\TestCase;
use Tests\Support\ScriptedTransport as T;

class GeminiParserTest extends TestCase
{
    public function test_parses_a_clean_players_object(): void
    {
        $this->assertSame(['Lionel Messi', 'Cristiano Ronaldo'], GeminiParser::parsePlayers(T::body('{"players": ["Lionel Messi", "Cristiano Ronaldo"]}')));
    }

    public function test_recovers_json_wrapped_in_fences_and_prose(): void
    {
        $body = T::body("Sure, here you go:\n```json\n{\"players\": [\"Kylian Mbappe\"]}\n```\nHope that helps!");
        $this->assertSame(['Kylian Mbappe'], GeminiParser::parsePlayers($body));
    }

    public function test_accepts_object_entries_with_a_name_field(): void
    {
        $this->assertSame(['Erling Haaland'], GeminiParser::parsePlayers(T::body('{"players": [{"name": "Erling Haaland", "note": "2023-24"}]}')));
    }

    public function test_trims_and_drops_empty_names(): void
    {
        $this->assertSame(['Özil', 'İlkay Gündoğan'], GeminiParser::parsePlayers(T::body('{"players": ["  Özil ", "", "İlkay Gündoğan", {"x": 1}]}')));
    }

    public function test_empty_players_is_an_empty_list_not_null(): void
    {
        $this->assertSame([], GeminiParser::parsePlayers(T::body('{"players": []}')));
    }

    public function test_null_on_max_tokens(): void
    {
        $this->assertNull(GeminiParser::parsePlayers(T::body('{"players": ["Partial', 'MAX_TOKENS')));
    }

    public function test_null_on_malformed_or_missing(): void
    {
        $this->assertNull(GeminiParser::parsePlayers('not json at all'));
        $this->assertNull(GeminiParser::parsePlayers(json_encode(['candidates' => []])));
        $this->assertNull(GeminiParser::parsePlayers(T::body('{"cells": []}')));
        $this->assertNull(GeminiParser::parsePlayers(T::body('no braces here')));
    }

    public function test_concatenates_multiple_text_parts(): void
    {
        $body = json_encode(['candidates' => [['content' => ['parts' => [['text' => '{"players": ['], ['text' => '"A"]}']]]]]]);
        $this->assertSame(['A'], GeminiParser::parsePlayers($body));
    }

    public function test_parse_cells_pads_to_nine(): void
    {
        $cells = GeminiParser::parseCells(T::cells(array_map(fn ($i) => ["P{$i}"], range(0, 4))), 9);
        $this->assertCount(9, $cells);
        $this->assertSame(['P0'], $cells[0]);
        $this->assertSame([], $cells[8]);
    }

    public function test_parse_cells_tolerates_bad_cells(): void
    {
        $cells = GeminiParser::parseCells(T::body('{"cells": ["x", {"players": "nope"}, {"players": [" A ", ""]}]}'), 9);
        $this->assertSame([], $cells[0]);
        $this->assertSame([], $cells[1]);
        $this->assertSame(['A'], $cells[2]);
    }
}
