<?php

namespace App\Http\Middleware;

use App\Services\AuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Puts the signed-in user (or null) on the request as the "user" attribute. */
class ResolveSessionUser
{
    public function __construct(private readonly AuthService $auth) {}

    public static function token(Request $request): ?string
    {
        $token = $request->cookies->get(config('flyball.session.cookie'));

        return is_string($token) && $token !== '' ? $token : null;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = self::token($request);
        $request->attributes->set('user', $token === null ? null : $this->auth->userForToken($token));

        return $next($request);
    }
}
