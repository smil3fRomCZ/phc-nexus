<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

/**
 * Regression test pro H8 z audit reportu 2026-04-17:
 * Google SSO callback neregeneroval session ID po Auth::login(),
 * což umožňovalo session fixation — útočník mohl podstrčit oběti
 * známé session ID (např. přes XSS přes jinou subdoménu) a po loginu
 * oběti používat ten samý session ID pro impersonaci.
 *
 * Po fixu se session ID po úspěšném loginu regeneruje.
 */
final class SessionFixationTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_id_regenerates_after_google_login(): void
    {
        $this->mockSocialiteUser('jan@pearseurope.com', 'Jan Novák');

        // První GET vytvoří session (bez autentizace) — zapamatujeme si ID.
        $this->get('/login');
        $sessionIdBeforeLogin = session()->getId();

        $this->get('/auth/google/callback?code=mock-code');

        $sessionIdAfterLogin = session()->getId();

        $this->assertAuthenticated();
        $this->assertNotSame(
            $sessionIdBeforeLogin,
            $sessionIdAfterLogin,
            'Session ID se musí po loginu regenerovat (fixation prevention).'
        );
    }

    private function mockSocialiteUser(string $email, string $name): void
    {
        $hostedDomain = substr(strrchr($email, '@') ?: '@', 1);

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
}
