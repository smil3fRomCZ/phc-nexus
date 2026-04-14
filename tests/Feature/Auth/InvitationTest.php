<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Modules\Auth\Mail\InvitationMail;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_executive_can_send_invitation(): void
    {
        Mail::fake();

        $admin = User::factory()->executive()->create();

        $response = $this->actingAs($admin)->post('/invitations', [
            'email' => 'novy@pearseurope.com',
            'system_role' => 'team_member',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invitations', ['email' => 'novy@pearseurope.com']);
        Mail::assertSent(InvitationMail::class);
    }

    public function test_pm_can_send_invitation(): void
    {
        Mail::fake();

        $pm = User::factory()->projectManager()->create();

        $response = $this->actingAs($pm)->post('/invitations', [
            'email' => 'novy@pearseurope.com',
            'system_role' => 'team_member',
        ]);

        $response->assertRedirect();
        Mail::assertSent(InvitationMail::class);
    }

    public function test_regular_member_cannot_send_invitation(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->post('/invitations', [
            'email' => 'novy@pearseurope.com',
            'system_role' => 'team_member',
        ]);

        $response->assertForbidden();
    }

    public function test_invitation_with_team_assignment(): void
    {
        Mail::fake();

        $admin = User::factory()->executive()->create();
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);

        $response = $this->actingAs($admin)->post('/invitations', [
            'email' => 'novy@pearseurope.com',
            'system_role' => 'team_member',
            'team_id' => $team->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invitations', [
            'email' => 'novy@pearseurope.com',
            'team_id' => $team->id,
        ]);
    }

    public function test_invitation_expires_after_24_hours(): void
    {
        Mail::fake();

        $admin = User::factory()->executive()->create();
        $this->actingAs($admin)->post('/invitations', [
            'email' => 'novy@pearseurope.com',
            'system_role' => 'team_member',
        ]);

        $invitation = Invitation::first();
        $this->assertTrue($invitation->isPending());
        $this->assertFalse($invitation->isExpired());

        $this->travel(25)->hours();
        $this->assertTrue($invitation->isExpired());
        $this->assertFalse($invitation->isPending());
    }

    public function test_accept_invite_redirects_to_google(): void
    {
        $invitation = $this->createPendingInvitation();

        $response = $this->get("/auth/invite/{$invitation->token}");

        $response->assertRedirect(route('auth.google'));
        $this->assertEquals($invitation->token, session('pending_invitation'));
    }

    public function test_accept_expired_invite_shows_error(): void
    {
        $invitation = $this->createPendingInvitation();
        $invitation->update(['expires_at' => now()->subHour()]);

        $response = $this->get("/auth/invite/{$invitation->token}");

        $response->assertRedirect(route('login'));
    }

    public function test_accept_already_used_invite_shows_error(): void
    {
        $invitation = $this->createPendingInvitation();
        $invitation->update(['accepted_at' => now()]);

        $response = $this->get("/auth/invite/{$invitation->token}");

        $response->assertRedirect(route('login'));
    }

    public function test_google_callback_with_invitation_sets_role_and_team(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);
        $invitation = $this->createPendingInvitation([
            'system_role' => SystemRole::ProjectManager,
            'team_id' => $team->id,
        ]);

        $this->mockSocialiteUser($invitation->email, 'Nový Uživatel');

        $response = $this->withSession(['pending_invitation' => $invitation->token])
            ->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', $invitation->email)->first();
        $this->assertEquals(SystemRole::ProjectManager, $user->system_role);
        $this->assertEquals($team->id, $user->team_id);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_google_callback_without_invitation_creates_default_user(): void
    {
        $this->mockSocialiteUser('random@pearseurope.com', 'Random User');

        $response = $this->get('/auth/google/callback?code=mock-code');

        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', 'random@pearseurope.com')->first();
        $this->assertEquals(SystemRole::TeamMember, $user->system_role);
        $this->assertNull($user->team_id);
    }

    public function test_invitation_rejects_disallowed_domain(): void
    {
        config()->set('auth.google_allowed_domains', ['pearseurope.com', 'pearshealthcyber.com']);

        $admin = User::factory()->executive()->create();

        $response = $this->actingAs($admin)
            ->from('/admin/users')
            ->post('/invitations', [
                'email' => 'external@gmail.com',
                'system_role' => 'team_member',
            ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('invitations', ['email' => 'external@gmail.com']);
    }

    private function createPendingInvitation(array $overrides = []): Invitation
    {
        $admin = User::factory()->executive()->create();

        return Invitation::create(array_merge([
            'email' => 'invited@pearseurope.com',
            'token' => 'test-token-'.uniqid(),
            'system_role' => SystemRole::TeamMember,
            'team_id' => null,
            'invited_by' => $admin->id,
            'expires_at' => now()->addHours(24),
        ], $overrides));
    }

    private function mockSocialiteUser(string $email, string $name): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);
        $socialiteUser->shouldReceive('getId')->andReturn('google-456');
        $socialiteUser->shouldReceive('getAvatar')->andReturn(null);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn(Mockery::mock()->shouldReceive('user')->andReturn($socialiteUser)->getMock());
    }
}
