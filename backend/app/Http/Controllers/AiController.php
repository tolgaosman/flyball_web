<?php

namespace App\Http\Controllers;

use App\Flyball\Ai\GeminiTransport;
use App\Flyball\Catalog\ClubCatalog;
use App\Flyball\Catalog\CountryCatalog;
use App\Flyball\Model\FactorPool;
use App\Flyball\Model\RoundKind;
use App\Services\FlyballService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use JsonSerializable;

/**
 * The AI endpoints. A GeminiQuotaExceededException from any of them becomes a
 * 429 in bootstrap/app.php, distinct from the 502 "unreachable" below.
 */
class AiController
{
    /** Answers = up to 2 grounded calls of 60 s each; boards/rounds can retry. */
    private const AI_TIME_LIMIT = 180;

    public function health(GeminiTransport $transport): JsonResponse
    {
        return json_ok(['status' => 'ok', 'aiConfigured' => $transport->isConfigured()]);
    }

    public function answers(Request $request, FlyballService $service): JsonResponse
    {
        $body = json_decode($request->getContent());
        if (! $body instanceof \stdClass) {
            return json_error('invalid_json_body');
        }
        $a = is_scalar($body->a ?? null) ? (string) $body->a : '';
        $b = is_scalar($body->b ?? null) ? (string) $body->b : '';
        if ($a === '' || $b === '') {
            return json_error('missing "a" or "b"');
        }

        $kind = $body->kind ?? null;
        if (! in_array($kind, ['two_team', 'team_country', 'xox'], true)) {
            return json_error('invalid "kind" (expected two_team | team_country | xox)');
        }
        // Conditions go straight into Gemini prompts: only catalogue values are
        // accepted, so the API can't be used as a free-text (or prompt-injection) proxy.
        if (! self::knownConditions($kind, $a, $b)) {
            return json_error('unknown condition');
        }

        set_time_limit(self::AI_TIME_LIMIT);
        $result = match ($kind) {
            'two_team' => $service->answersForTwoTeam($a, $b),
            'team_country' => $service->answersForTeamCountry($a, $b),
            'xox' => $service->answersForFactors($a, $b),
        };

        return $result === null ? json_error('AI search failed — try again', 502) : json_ok($result);
    }

    private static function knownConditions(string $kind, string $a, string $b): bool
    {
        return match ($kind) {
            'two_team' => $a !== $b && ClubCatalog::byName($a) !== null && ClubCatalog::byName($b) !== null,
            'team_country' => ClubCatalog::byName($a) !== null && CountryCatalog::byName($b) !== null,
            'xox' => FactorPool::isKnownLabel($a) && FactorPool::isKnownLabel($b),
        };
    }

    public function twoTeamRound(FlyballService $service): JsonResponse
    {
        set_time_limit(self::AI_TIME_LIMIT);

        return $this->orUnreachable($service->nextRound(RoundKind::TwoTeam));
    }

    public function teamCountryRound(FlyballService $service): JsonResponse
    {
        set_time_limit(self::AI_TIME_LIMIT);

        return $this->orUnreachable($service->nextRound(RoundKind::TeamCountry));
    }

    public function xoxBoard(FlyballService $service): JsonResponse
    {
        set_time_limit(self::AI_TIME_LIMIT);

        return $this->orUnreachable($service->nextBoard());
    }

    private function orUnreachable(?JsonSerializable $value): JsonResponse
    {
        return $value === null ? json_error('AI unreachable — try again', 502) : json_ok($value);
    }
}
