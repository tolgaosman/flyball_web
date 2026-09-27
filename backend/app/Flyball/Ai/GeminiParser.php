<?php

namespace App\Flyball\Ai;

use stdClass;

/**
 * Turns a raw generateContent body into player lists / board cells.
 * No JSON repair: a truncated (MAX_TOKENS) or malformed reply is null and the
 * caller falls back. Objects decode as stdClass so JSON maps vs lists stay distinct.
 */
final class GeminiParser
{
    /** @return list<string>|null — [] is a valid "found nobody" */
    public static function parsePlayers(string $responseBody): ?array
    {
        $obj = self::extractResponseJson($responseBody, 'players');
        if ($obj === null || ! is_array($obj->players)) {
            return null;
        }

        $names = array_map(function (mixed $e): string {
            if (is_string($e)) {
                return $e;
            }
            if ($e instanceof stdClass) {
                return isset($e->name) ? self::stringify($e->name) : '';
            }

            return self::stringify($e);
        }, $obj->players);

        return self::cleaned($names);
    }

    /** @return list<list<string>>|null — always exactly $expectedCells entries */
    public static function parseCells(string $responseBody, int $expectedCells): ?array
    {
        $obj = self::extractResponseJson($responseBody, 'cells');
        if ($obj === null || ! is_array($obj->cells)) {
            return null;
        }

        $cells = [];
        for ($i = 0; $i < $expectedCells; $i++) {
            $cell = $obj->cells[$i] ?? null;
            $players = $cell instanceof stdClass ? ($cell->players ?? null) : null;
            $cells[] = is_array($players) ? self::cleaned(array_map(self::stringify(...), $players)) : [];
        }

        return $cells;
    }

    private static function extractResponseJson(string $responseBody, string $key): ?stdClass
    {
        $decoded = json_decode($responseBody);
        if (! $decoded instanceof stdClass) {
            return null;
        }
        $candidates = $decoded->candidates ?? null;
        if (! is_array($candidates) || $candidates === [] || ! $candidates[0] instanceof stdClass) {
            return null;
        }
        $first = $candidates[0];
        if (($first->finishReason ?? null) === 'MAX_TOKENS') {
            return null;
        }
        $parts = ($first->content ?? null) instanceof stdClass ? ($first->content->parts ?? null) : null;
        if (! is_array($parts) || $parts === []) {
            return null;
        }

        $text = '';
        foreach ($parts as $part) {
            if ($part instanceof stdClass && is_string($part->text ?? null)) {
                $text .= $part->text;
            }
        }
        if ($text === '') {
            return null;
        }

        $inner = self::extractJsonObject($text);

        return $inner !== null && property_exists($inner, $key) ? $inner : null;
    }

    /** First '{' through the LAST '}' — tolerates fences and prose around the JSON. */
    private static function extractJsonObject(string $text): ?stdClass
    {
        $start = strpos($text, '{');
        $end = strrpos($text, '}');
        if ($start === false || $end === false || $end <= $start) {
            return null;
        }
        $decoded = json_decode(substr($text, $start, $end - $start + 1));

        return $decoded instanceof stdClass ? $decoded : null;
    }

    /** @param list<string> $names */
    private static function cleaned(array $names): array
    {
        return array_values(array_filter(array_map('trim', $names), fn (string $n) => $n !== ''));
    }

    private static function stringify(mixed $value): string
    {
        return match (true) {
            is_string($value) => $value,
            is_bool($value) => $value ? 'true' : 'false',
            $value === null => 'null',
            is_scalar($value) => (string) $value,
            default => json_encode($value, JSON_UNESCAPED_UNICODE),
        };
    }
}
