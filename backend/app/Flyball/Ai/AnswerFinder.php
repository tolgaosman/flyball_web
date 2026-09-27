<?php

namespace App\Flyball\Ai;

use App\Flyball\Model\AnswerResult;

/**
 * Two-phase grounded search: RECALL (wide net, never filtered) then VERIFY
 * (keep only names a source links to BOTH conditions).
 */
final class AnswerFinder
{
    public function __construct(private readonly GeminiTransport $transport) {}

    /**
     * null = nothing to show (recall failed or found nobody).
     *
     * @throws GeminiQuotaExceededException when RECALL hits the quota.
     */
    public function search(string $condition1, string $condition2): ?AnswerResult
    {
        $candidates = $this->ask(Prompts::recall($condition1, $condition2), 512, 8192);
        if ($candidates === null || $candidates === []) {
            return null;
        }

        // Recall already succeeded, so a quota hit here still leaves a real
        // (unverified) list worth showing.
        try {
            $verified = $this->ask(Prompts::verify($candidates, $condition1, $condition2), 2048, 4096);
        } catch (GeminiQuotaExceededException) {
            $verified = null;
        }

        if ($verified !== null) {
            // [] means the model rejected every candidate — still a verified answer.
            return new AnswerResult($verified, verified: true);
        }

        return new AnswerResult($candidates, verified: false);
    }

    /** @return list<string>|null */
    private function ask(string $prompt, int $thinkingBudget, int $maxOutputTokens): ?array
    {
        $body = $this->transport->generateContent($prompt, $thinkingBudget, $maxOutputTokens);

        return $body === null ? null : GeminiParser::parsePlayers($body);
    }
}
