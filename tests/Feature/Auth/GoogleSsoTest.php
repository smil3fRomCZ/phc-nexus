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
        $this->mockSocialiteUser('jan@pearshealthcare.cz', 'Jan Novák');

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'jan@pearshealthcare.cz',
            'name' => 'Jan Novák',
        ]);
    }

    public function test_google_callback_logs_in_existing_user(): void
    {
        $user = User::factory()->create([
            'email' => 'jan@pearshealthcare.cz',
            'name' => 'Jan Starý',
        ]);

        $this->mockSocialiteUser('jan@pearshealthcare.cz', 'Jan Novák');

        $response = $this->get('/auth/google/callback');

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

    private function mockSocialiteUser(string $email, string $name): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);
        $socialiteUser->shouldReceive('getId')->andReturn('google-123');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn(Mockery::mock()->shouldReceive('user')->andReturn($socialiteUser)->getMock());
    }
}
