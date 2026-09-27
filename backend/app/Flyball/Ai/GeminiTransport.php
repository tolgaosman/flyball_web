<?php

namespace App\Flyball\Ai;

interface GeminiTransport
{
    /**
     * One grounded generateContent call. Returns Gemini's raw JSON body, or
     * null on any failure (network, timeout, non-200, no key).
     *
     * @throws GeminiQuotaExceededException on HTTP 429 — never retry that.
     */
    public function generateContent(string $prompt, int $thinkingBudget, int $maxOutputTokens): ?string;

    public function isConfigured(): bool;
}
