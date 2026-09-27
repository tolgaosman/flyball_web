<?php

namespace App\Services;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Username/password accounts with opaque session tokens. Only the SHA-256 of
 * a token is stored; sessions last a fixed 90 days.
 */
final class AuthService
{
    /** Verified against for unknown usernames, so response timing never reveals which names exist. */
    private ?string $dummyHash = null;

    /** @return array{user: array, token: string}|array{error: string} */
    public function register(string $username, string $password, ?string $displayName): array
    {
        $username = AccountRules::trim($username);
        $displayName = AccountRules::trim($displayName ?? '');
        if ($displayName === '') {
            $displayName = $username;
        }

        $error = AccountRules::validateUsername($username)
            ?? AccountRules::validatePassword($password)
            ?? AccountRules::validateDisplayName($displayName);
        if ($error !== null) {
            return ['error' => $error];
        }

        try {
            $id = DB::table('users')->insertGetId([
                'username' => $username,
                'display_name' => $displayName,
                'password_hash' => Hash::make($password),
                'created_at' => now()->getTimestampMs(),
            ]);
        } catch (UniqueConstraintViolationException) {
            return ['error' => AccountRules::error('usernameTaken')];
        }

        return ['user' => $this->userJson(DB::table('users')->find($id)), 'token' => $this->issueSession($id)];
    }

    /** @return array{user: array, token: string}|array{error: string} */
    public function login(string $username, string $password): array
    {
        $throttleKey = 'login:'.mb_strtolower(AccountRules::trim($username));
        $throttle = config('flyball.login_throttle');
        if (RateLimiter::tooManyAttempts($throttleKey, $throttle['max_failures'])) {
            return ['error' => AccountRules::error('tooManyAttempts')];
        }

        $user = DB::table('users')->where('username', AccountRules::trim($username))->first();
        $valid = Hash::check($password, $user->password_hash ?? $this->dummyHash());
        if ($user === null || ! $valid) {
            RateLimiter::hit($throttleKey, $throttle['window_seconds']);

            return ['error' => AccountRules::error('invalidCredentials')];
        }

        RateLimiter::clear($throttleKey);
        DB::table('auth_sessions')->where('expires_at', '<=', now()->getTimestampMs())->delete();

        return ['user' => $this->userJson($user), 'token' => $this->issueSession($user->id)];
    }

    public function logout(string $token): void
    {
        DB::table('auth_sessions')->where('token_hash', self::hashToken($token))->delete();
    }

    public function userForToken(string $token): ?array
    {
        $row = DB::table('auth_sessions')
            ->join('users', 'users.id', '=', 'auth_sessions.user_id')
            ->where('auth_sessions.token_hash', self::hashToken($token))
            ->select('users.*', 'auth_sessions.expires_at')
            ->first();
        if ($row === null) {
            return null;
        }
        if ($row->expires_at <= now()->getTimestampMs()) {
            $this->logout($token);

            return null;
        }

        return $this->userJson($row);
    }

    private function issueSession(int $userId): string
    {
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $now = now()->getTimestampMs();
        DB::table('auth_sessions')->insert([
            'token_hash' => self::hashToken($token),
            'user_id' => $userId,
            'created_at' => $now,
            'expires_at' => $now + config('flyball.session.ttl_days') * 86_400_000,
        ]);

        return $token;
    }

    private static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function dummyHash(): string
    {
        return $this->dummyHash ??= Hash::make(random_bytes(16));
    }

    private function userJson(object $row): array
    {
        return [
            'id' => (int) $row->id,
            'username' => $row->username,
            'displayName' => $row->display_name,
            'createdAt' => (int) $row->created_at,
        ];
    }
}
