<?php

namespace Tests\Unit;

use App\Flyball\Ai\AnswerFinder;
use App\Flyball\Ai\GeminiQuotaExceededException;
use Tests\Support\ScriptedTransport as T;
use Tests\TestCase;

class AnswerFinderTest extends TestCase
{
    public function test_recall_plus_verify_gives_a_verified_result(): void
    {
        $t = new T([T::players(['A', 'B', 'C']), T::players(['A', 'B'])]);
        $result = (new AnswerFinder($t))->search('X', 'Y');
        $this->assertSame(['A', 'B'], $result->players);
        $this->assertTrue($result->verified);
        $this->assertSame(2, $t->calls());
        $this->assertStringContainsString('CANDIDATES: ["A","B","C"]', $t->prompts[1]);
    }

    public function test_empty_recall_returns_null_without_verifying(): void
    {
        $t = new T([T::players([])]);
        $this->assertNull((new AnswerFinder($t))->search('X', 'Y'));
        $this->assertSame(1, $t->calls());
    }

    public function test_recall_transport_failure_returns_null(): void
    {
        $this->assertNull((new AnswerFinder(new T([null])))->search('X', 'Y'));
    }

    public function test_verify_rejecting_everyone_is_empty_and_verified(): void
    {
        $result = (new AnswerFinder(new T([T::players(['A']), T::players([])])))->search('X', 'Y');
        $this->assertSame([], $result->players);
        $this->assertTrue($result->verified);
    }

    public function test_verify_failure_falls_back_to_unverified_recall(): void
    {
        $result = (new AnswerFinder(new T([T::players(['A', 'B']), null])))->search('X', 'Y');
        $this->assertSame(['A', 'B'], $result->players);
        $this->assertFalse($result->verified);
    }

    public function test_quota_during_verify_falls_back_to_unverified_recall(): void
    {
        $result = (new AnswerFinder(new T([T::players(['A']), 'quota'])))->search('X', 'Y');
        $this->assertSame(['A'], $result->players);
        $this->assertFalse($result->verified);
    }

    public function test_quota_during_recall_propagates(): void
    {
        $this->expectException(GeminiQuotaExceededException::class);
        (new AnswerFinder(new T(['quota'])))->search('X', 'Y');
    }
}
