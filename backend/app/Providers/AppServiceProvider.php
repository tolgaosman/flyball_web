<?php

namespace App\Providers;

use App\Flyball\Ai\GeminiTransport;
use App\Flyball\Ai\HttpGeminiTransport;
use App\Services\AiCacheStore;
use App\Services\AuthService;
use App\Services\FlyballService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GeminiTransport::class, fn () => new HttpGeminiTransport(
            (string) config('flyball.gemini.key'),
            (string) config('flyball.gemini.model'),
            (int) config('flyball.gemini.timeout'),
        ));
        $this->app->singleton(AiCacheStore::class);
        $this->app->singleton(AuthService::class);
        $this->app->singleton(FlyballService::class);
        $this->app->when(FlyballService::class)->needs('$bufferTarget')->giveConfig('flyball.buffer_target');
    }

    public function boot(): void
    {
        // Per-IP caps: every AI request can cost Gemini quota, and auth routes
        // are the credential-stuffing surface (the per-username lock is separate).
        RateLimiter::for('ai', fn (Request $request) => Limit::perMinute(30)->by($request->ip())
            ->response(fn () => json_error('too_many_requests', 429)));
        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(20)->by($request->ip())
            ->response(fn () => json_error('too_many_attempts', 429)));
    }
}
