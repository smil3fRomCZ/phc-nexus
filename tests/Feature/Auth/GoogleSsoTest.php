<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleSsoTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_is_accessible(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
    }

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');

        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->headers->get('Location') ?? '');
    }

    public function test_google_callback_creates_new_user(): void
    {
        $this->mockSocialiteUser('jan@pearseurope.com', 'Jan Novák');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'jan@pearseurope.com',
            'name' => 'Jan Novák',
        ]);
    }

    public function test_google_callback_logs_in_existing_user(): void
    {
        $user = User::factory()->create([
            'email' => 'jan@pearseurope.com',
            'name' => 'Jan Starý',
        ]);

        $this->mockSocialiteUser('jan@pearseurope.com', 'Jan Novák');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user->fresh());
        // Jméno se aktualizuje z Google
        $this->assertEquals('Jan Novák', $user->fresh()->name);
    }

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard/Index'));
    }

    public function test_google_callback_rejects_disallowed_domain(): void
    {
        config()->set('auth.google_allowed_domains', ['pearseurope.com', 'pearshealthcyber.com']);

        $this->mockSocialiteUser('attacker@gmail.com', 'Mr Bad');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'attacker@gmail.com']);
    }

    public function test_google_callback_accepts_second_allowed_domain(): void
    {
        config()->set('auth.google_allowed_domains', ['pearseurope.com', 'pearshealthcyber.com']);

        $this->mockSocialiteUser('ops@pearshealthcyber.com', 'Ops User');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
    }

    public function test_logout_works(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_guest_cannot_access_logout(): void
    {
        $response = $this->post('/logout');

        $response->assertRedirect('/login');
    }

    private function mockSocialiteUser(string $email, string $name, ?string $hd = null): void
    {
        // Default hd = doména z e-mailu (odpovídá běžnému Workspace tokenu).
        $hostedDomain = $hd ?? substr(strrchr($email, '@') ?: '@', 1);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);
        $socialiteUser->shouldReceive('getId')->andReturn('google-123');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);
        $socialiteUser->shouldReceive('getRaw')->andReturn(['hd' => $hostedDomain]);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn(Mockery::mock()->shouldReceive('user')->andReturn($socialiteUser)->getMock());
    }

    public function test_google_callback_rejects_account_without_hd_claim(): void
    {
        config()->set('auth.google_allowed_domains', ['pearseurope.com']);

        // Útočník: má e-mail z firemní domény, ale účet je osobní gmail (žádný hd claim).
        $this->mockSocialiteUser('attacker@pearseurope.com', 'Attacker', hd: '');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_google_callback_rejects_mismatched_hd_claim(): void
    {
        config()->set('auth.google_allowed_domains', ['pearseurope.com']);

        // hd z jiné Workspace tenanty než e-mail (možný spoofing scénář).
        $this->mockSocialiteUser('user@pearseurope.com', 'User', hd: 'evil.com');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }
}
