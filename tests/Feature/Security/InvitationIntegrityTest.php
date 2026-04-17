<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\SystemRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

/**
 * Regression tests pro findings z audit reportu 2026-04-17:
 * - C2: Invitation token swap → privilege escalation (email mismatch)
 * - M10: Invitation token v DB plaintextem (DB dump leak)
 *
 * Před fixem: Socialite callback akceptoval invitation token bez ohledu na
 * email Google účtu → útočník přes cizí invitation URL získal její roli pro
 * svůj vlastní firemní účet.
 */
final class InvitationIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_token_stored_as_sha256_hash_not_plaintext(): void
    {
        $invitation = $this->createInvitation([
            'token' => 'plaintext-token-xyz',
        ]);

        $row = DB::table('invitations')
            ->where('id', $invitation->id)
            ->first();

        $this->assertEquals(
            hash('sha256', 'plaintext-token-xyz'),
            $row->token_hash,
        );
    }

    public function test_invitation_with_mismatched_email_is_rejected(): void
    {
        $invitation = $this->createInvitation([
            'email' => 'invited@pearseurope.com',
            'token' => 'match-me',
            'system_role' => SystemRole::Executive,
        ]);

        // Útočník má platný firemní účet, ale ne ten pozvaný.
        $this->mockSocialiteUser('attacker@pearseurope.com', 'Attacker');

        $response = $this->withSession(['pending_invitation' => $invitation->token])
            ->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('login'));

        // User by neměl dostat executive roli — ani se vytvořit s ní.
        $user = User::where('email', 'attacker@pearseurope.com')->first();
        if ($user !== null) {
            $this->assertNotEquals(SystemRole::Executive, $user->system_role);
        }

        // Pozvánka zůstává nevyřízená pro skutečného příjemce.
        $this->assertNull($invitation->fresh()->accepted_at);
    }

    public function test_expired_invitation_is_rejected(): void
    {
        $invitation = $this->createInvitation([
            'email' => 'invited@pearseurope.com',
            'token' => 'expired',
            'expires_at' => now()->subHour(),
            'system_role' => SystemRole::Executive,
        ]);

        $this->mockSocialiteUser('invited@pearseurope.com', 'Invited');

        $response = $this->withSession(['pending_invitation' => $invitation->token])
            ->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('login'));

        // User neměl být vytvořen s executive rolí z expirované pozvánky.
        $user = User::where('email', 'invited@pearseurope.com')->first();
        if ($user !== null) {
            $this->assertNotEquals(SystemRole::Executive, $user->system_role);
        }

        $this->assertNull($invitation->fresh()->accepted_at);
    }

    public function test_invitation_does_not_overwrite_existing_user_role(): void
    {
        $existing = User::factory()->create([
            'email' => 'existing@pearseurope.com',
            'system_role' => SystemRole::TeamMember,
        ]);

        $invitation = $this->createInvitation([
            'email' => 'existing@pearseurope.com',
            'token' => 'escalate',
            'system_role' => SystemRole::Executive,
        ]);

        $this->mockSocialiteUser('existing@pearseurope.com', 'Existing');

        $response = $this->withSession(['pending_invitation' => $invitation->token])
            ->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));

        // Role existujícího uživatele zůstává nezměněná; pozvánka je spotřebována.
        $existing->refresh();
        $this->assertEquals(SystemRole::TeamMember, $existing->system_role);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_case_insensitive_email_matching(): void
    {
        $invitation = $this->createInvitation([
            'email' => 'Mixed.Case@pearseurope.com',
            'token' => 'case-token',
            'system_role' => SystemRole::ProjectManager,
        ]);

        $this->mockSocialiteUser('mixed.case@pearseurope.com', 'Case User');

        $response = $this->withSession(['pending_invitation' => $invitation->token])
            ->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));

        $user = User::whereRaw('LOWER(email) = ?', ['mixed.case@pearseurope.com'])->first();
        $this->assertNotNull($user);
        $this->assertEquals(SystemRole::ProjectManager, $user->system_role);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createInvitation(array $overrides = []): Invitation
    {
        $admin = User::factory()->executive()->create();

        return Invitation::create(array_merge([
            'email' => 'invited@pearseurope.com',
            'token' => 'default-token-'.uniqid(),
            'system_role' => SystemRole::TeamMember,
            'team_id' => null,
            'invited_by' => $admin->id,
            'expires_at' => now()->addHours(24),
        ], $overrides));
    }

    private function mockSocialiteUser(string $email, string $name): void
    {
        $hostedDomain = substr(strrchr($email, '@') ?: '@', 1);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);
        $socialiteUser->shouldReceive('getId')->andReturn('google-attacker');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);
        $socialiteUser->shouldReceive('getRaw')->andReturn(['hd' => strtolower($hostedDomain)]);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn(Mockery::mock()->shouldReceive('user')->andReturn($socialiteUser)->getMock());
    }
}
