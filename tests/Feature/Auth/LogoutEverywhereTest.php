<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Http\Middleware\EnforceSecurityStamp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutEverywhereTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_everywhere_rotates_security_stamp(): void
    {
        $user = User::factory()->create(['security_stamp' => 'initial-stamp']);

        $this->actingAs($user)
            ->withSession([EnforceSecurityStamp::SESSION_KEY => 'initial-stamp'])
            ->post('/profile/logout-everywhere')
            ->assertRedirect();

        $this->assertNotSame('initial-stamp', $user->fresh()->security_stamp);
    }

    public function test_session_with_stale_stamp_is_logged_out(): void
    {
        $user = User::factory()->create(['security_stamp' => 'fresh-stamp']);

        // Simuluje jiné zařízení — session má starý stamp.
        $response = $this->actingAs($user)
            ->withSession([EnforceSecurityStamp::SESSION_KEY => 'old-stamp'])
            ->get('/');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_session_with_matching_stamp_passes(): void
    {
        $user = User::factory()->create(['security_stamp' => 'match-stamp']);

        $response = $this->actingAs($user)
            ->withSession([EnforceSecurityStamp::SESSION_KEY => 'match-stamp'])
            ->get('/');

        $response->assertStatus(200);
    }

    public function test_legacy_session_without_stamp_gets_backfilled(): void
    {
        $user = User::factory()->create(['security_stamp' => 'backfill-stamp']);

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200);
        // Po requestu má session stamp naplněný aktuálním user stampem.
        $this->assertSame('backfill-stamp', session(EnforceSecurityStamp::SESSION_KEY));
    }
}
