<?php

namespace App\Flyball\Ai;

use RuntimeException;

/**
 * Gemini answered 429. Deliberately NOT a null result: it propagates past
 * retry loops (which only retry on null), because retrying a call that is
 * guaranteed to fail the same way just burns what quota may remain.
 */
final class GeminiQuotaExceededException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('AI quota exceeded');
    }
}
