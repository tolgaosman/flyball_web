<?php

namespace Tests\Support;

use App\Flyball\Ai\GeminiQuotaExceededException;
use App\Flyball\Ai\GeminiTransport;

/**
 * Replays scripted responses in call order. null simulates a transport
 * failure, 'quota' a 429. Past the end it repeats the last entry.
 */
final class ScriptedTransport implements GeminiTransport
{
    /** @var list<string> */
    public array $prompts = [];

    /** @param list<string|null> $responses */
    public function __construct(private readonly array $responses) {}

    public function isConfigured(): bool
    {
        return true;
    }

    public function generateContent(string $prompt, int $thinkingBudget, int $maxOutputTokens): ?string
    {
        $i = count($this->prompts);
        $this->prompts[] = $prompt;
        $response = $this->responses[$i] ?? ($this->responses === [] ? null : $this->responses[array_key_last($this->responses)]);
        if ($response === 'quota') {
            throw new GeminiQuotaExceededException;
        }

        return $response;
    }

    public function calls(): int
    {
        return count($this->prompts);
    }

    public static function body(string $text, string $finishReason = 'STOP'): string
    {
        return json_encode(['candidates' => [[
            'finishReason' => $finishReason,
            'content' => ['parts' => [['text' => $text]]],
        ]]]);
    }

    /** @param list<string> $players */
    public static function players(array $players): string
    {
        return self::body(json_encode(['players' => $players]));
    }

    /** @param list<list<string>> $cells */
    public static function cells(array $cells): string
    {
        return self::body(json_encode(['cells' => array_map(fn ($c) => ['players' => $c], $cells)]));
    }
}
