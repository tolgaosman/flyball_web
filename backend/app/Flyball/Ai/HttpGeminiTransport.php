<?php

namespace App\Flyball\Ai;

use Illuminate\Support\Facades\Http;
use Throwable;

final class HttpGeminiTransport implements GeminiTransport
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly int $timeoutSeconds = 60,
    ) {}

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function generateContent(string $prompt, int $thinkingBudget, int $maxOutputTokens): ?string
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::timeout($this->timeoutSeconds)
                ->withHeaders(['x-goog-api-key' => $this->apiKey])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent", [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'tools' => [['google_search' => new \stdClass]],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'thinkingConfig' => ['thinkingBudget' => $thinkingBudget],
                        'maxOutputTokens' => $maxOutputTokens,
                    ],
                ]);
        } catch (Throwable) {
            return null;
        }

        if ($response->status() === 429) {
            throw new GeminiQuotaExceededException;
        }

        return $response->status() === 200 ? $response->body() : null;
    }
}
