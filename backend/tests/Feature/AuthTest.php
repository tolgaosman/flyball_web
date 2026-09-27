<?php

namespace Tests\Feature;

use App\Services\AccountRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function register(array $body): TestResponse
    {
        return $this->postJson('/api/auth/register', $body);
    }

    private function login(string $username, string $password): TestResponse
    {
        return $this->postJson('/api/auth/login', ['username' => $username, 'password' => $password]);
    }

    private function sessionCookie(TestResponse $response): string
    {
        return $response->getCookie('flyball_session', false)->getValue();
    }

    public function test_register_sets_an_http_only_cookie_and_never_returns_the_token(): void
    {
        $response = $this->register(['username' => 'Osman', 'password' => 'correct horse'])->assertStatus(201);
        $response->assertJson(['user' => ['username' => 'Osman', 'displayName' => 'Osman']]);
        $this->assertArrayNotHasKey('token', $response->json());

        $cookie = $response->getCookie('flyball_session', false);
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('lax', $cookie->getSameSite());
        $this->assertSame(43, strlen($cookie->getValue()));
        $this->assertIsInt($response->json('user.createdAt'));
    }

    public function test_register_validation_codes(): void
    {
        $this->register(['username' => 'a b', 'password' => 'correct horse'])->assertStatus(400)->assertExactJson(['error' => 'invalid_username']);
        $this->assertSame('invalid_username', AccountRules::validateUsername("abc\n"));
        $this->assertSame('invalid_username', AccountRules::validateUsername('ab'));
        $this->assertNull(AccountRules::validateUsername('tolga.osman_1'));
        $this->register(['username' => 'osman', 'password' => 'short'])->assertStatus(400)->assertExactJson(['error' => 'weak_password']);
        $this->register(['username' => 'osman', 'password' => 'correct horse', 'displayName' => str_repeat('x', 25)])
            ->assertStatus(400)->assertExactJson(['error' => 'invalid_display_name']);
        $this->register(['username' => 'osman', 'password' => 'correct horse', 'displayName' => '  Tolga  '])
            ->assertStatus(201)->assertJson(['user' => ['displayName' => 'Tolga']]);
    }

    public function test_usernames_are_unique_case_insensitively(): void
    {
        $this->register(['username' => 'Osman', 'password' => 'correct horse'])->assertStatus(201);
        $this->register(['username' => 'osman', 'password' => 'correct horse'])->assertStatus(409)->assertExactJson(['error' => 'username_taken']);
    }

    public function test_login_is_case_insensitive_and_keeps_registered_casing(): void
    {
        $this->register(['username' => 'Osman', 'password' => 'correct horse']);
        $this->login('OSMAN', 'correct horse')->assertOk()->assertJson(['user' => ['username' => 'Osman']]);
    }

    public function test_unknown_user_and_wrong_password_look_identical(): void
    {
        $this->register(['username' => 'Osman', 'password' => 'correct horse']);
        $this->login('Osman', 'wrong password')->assertStatus(401)->assertExactJson(['error' => 'invalid_credentials']);
        $this->login('nobody', 'wrong password')->assertStatus(401)->assertExactJson(['error' => 'invalid_credentials']);
    }

    public function test_five_failures_lock_the_account_for_fifteen_minutes(): void
    {
        Carbon::setTestNow('2026-09-27 12:00:00');
        $this->register(['username' => 'Osman', 'password' => 'correct horse']);
        for ($i = 0; $i < 5; $i++) {
            $this->login('Osman', 'wrong password')->assertStatus(401);
        }
        $this->login('osman', 'correct horse')->assertStatus(429)->assertExactJson(['error' => 'too_many_attempts']);

        Carbon::setTestNow('2026-09-27 12:16:00');
        $this->login('Osman', 'correct horse')->assertOk();
    }

    public function test_me_logout_and_session_expiry(): void
    {
        $token = $this->sessionCookie($this->register(['username' => 'Osman', 'password' => 'correct horse']));

        $this->withCredentials()->withUnencryptedCookie('flyball_session', $token)->getJson('/api/auth/me')->assertOk()->assertJson(['user' => ['username' => 'Osman']]);
        $this->withCredentials()->withUnencryptedCookie('flyball_session', $token)->postJson('/api/auth/logout')->assertNoContent();
        $this->withCredentials()->withUnencryptedCookie('flyball_session', $token)->getJson('/api/auth/me')->assertStatus(401)->assertExactJson(['error' => 'unauthorized']);
        $this->getJson('/api/auth/me')->assertStatus(401);

        $token = $this->sessionCookie($this->login('Osman', 'correct horse'));
        Carbon::setTestNow(now()->addDays(91));
        $this->withCredentials()->withUnencryptedCookie('flyball_session', $token)->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_logout_is_always_204(): void
    {
        $this->postJson('/api/auth/logout')->assertNoContent();
        $this->withCredentials()->withUnencryptedCookie('flyball_session', 'garbage')->postJson('/api/auth/logout')->assertNoContent();
    }

    public function test_state_changing_auth_routes_require_json(): void
    {
        $this->post('/api/auth/login', ['username' => 'Osman', 'password' => 'correct horse'])
            ->assertStatus(415);
    }
}
