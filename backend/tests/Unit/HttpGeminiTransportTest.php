<?php

namespace Tests\Unit;

use App\Flyball\Ai\GeminiQuotaExceededException;
use App\Flyball\Ai\HttpGeminiTransport;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpGeminiTransportTest extends TestCase
{
    public function test_sends_a_grounded_request_with_the_key_in_a_header(): void
    {
        Http::fake(['*' => Http::response('{"ok":true}', 200)]);
        $body = (new HttpGeminiTransport('secret', 'gemini-2.5-flash'))->generateContent('hi', 512, 8192);

        $this->assertSame('{"ok":true}', $body);
        Http::assertSent(function (Request $request) {
            $json = $request->data();

            return $request->url() === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
                && $request->hasHeader('x-goog-api-key', 'secret')
                && $json['contents'][0]['parts'][0]['text'] === 'hi'
                && str_contains($request->body(), '"tools":[{"google_search":{}}]')
                && $json['generationConfig'] === ['temperature' => 0.2, 'thinkingConfig' => ['thinkingBudget' => 512], 'maxOutputTokens' => 8192];
        });
    }

    public function test_429_throws_quota_exception(): void
    {
        Http::fake(['*' => Http::response('{}', 429)]);
        $this->expectException(GeminiQuotaExceededException::class);
        (new HttpGeminiTransport('secret', 'm'))->generateContent('hi', 1, 1);
    }

    public function test_other_failures_are_null(): void
    {
        Http::fake(['*' => Http::response('{}', 503)]);
        $this->assertNull((new HttpGeminiTransport('secret', 'm'))->generateContent('hi', 1, 1));
    }

    public function test_no_key_makes_no_request(): void
    {
        Http::fake();
        $transport = new HttpGeminiTransport('', 'm');
        $this->assertFalse($transport->isConfigured());
        $this->assertNull($transport->generateContent('hi', 1, 1));
        Http::assertNothingSent();
    }
}
