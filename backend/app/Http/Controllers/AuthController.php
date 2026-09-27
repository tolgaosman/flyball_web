<?php

namespace App\Http\Controllers;

use App\Http\Middleware\ResolveSessionUser;
use App\Services\AccountRules;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * /api/auth/*. The session token only ever travels as an httpOnly cookie —
 * it is never in a response body, so page scripts cannot read it.
 */
class AuthController
{
    public function __construct(private readonly AuthService $auth) {}

    public function register(Request $request): JsonResponse
    {
        $body = $this->body($request);
        if ($body === null) {
            return json_error('invalid_json_body');
        }
        $result = $this->auth->register(
            $this->str($body, 'username'),
            $this->str($body, 'password'),
            isset($body['displayName']) ? $this->str($body, 'displayName') : null,
        );
        if (isset($result['error'])) {
            $status = $result['error'] === AccountRules::error('usernameTaken') ? 409 : 400;

            return json_error($result['error'], $status);
        }

        return $this->signedIn($request, $result, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $body = $this->body($request);
        if ($body === null) {
            return json_error('invalid_json_body');
        }
        $result = $this->auth->login($this->str($body, 'username'), $this->str($body, 'password'));
        if (isset($result['error'])) {
            $status = $result['error'] === AccountRules::error('tooManyAttempts') ? 429 : 401;

            return json_error($result['error'], $status);
        }

        return $this->signedIn($request, $result, 200);
    }

    public function logout(Request $request): Response
    {
        $token = ResolveSessionUser::token($request);
        if ($token !== null) {
            $this->auth->logout($token);
        }

        return response()->noContent()->withCookie($this->cookie($request, '', -1));
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('user');

        return $user === null ? json_error(AccountRules::error('unauthorized'), 401) : json_ok(['user' => $user]);
    }

    private function signedIn(Request $request, array $result, int $status): JsonResponse
    {
        $minutes = config('flyball.session.ttl_days') * 24 * 60;

        return json_ok(['user' => $result['user']], $status)->withCookie($this->cookie($request, $result['token'], $minutes));
    }

    private function cookie(Request $request, string $value, int $minutes): Cookie
    {
        return cookie(
            config('flyball.session.cookie'),
            $value,
            $minutes,
            path: '/',
            secure: $request->isSecure(),
            httpOnly: true,
            raw: true,
            sameSite: 'lax',
        );
    }

    private function body(Request $request): ?array
    {
        $decoded = json_decode($request->getContent(), true);

        return is_array($decoded) && ! array_is_list($decoded) ? $decoded : null;
    }

    private function str(array $body, string $key): string
    {
        return is_scalar($body[$key] ?? null) ? (string) $body[$key] : '';
    }
}
