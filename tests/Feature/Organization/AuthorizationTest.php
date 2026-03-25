<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    // --- Division Policy ---

    public function test_anyone_can_view_divisions(): void
    {
        $user = User::factory()->reader()->create();
        $division = Division::create(['name' => 'Engineering']);

        $this->assertTrue($user->can('view', $division));
        $this->assertTrue($user->can('viewAny', Division::class));
    }

    public function test_only_executive_can_create_division(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $member = User::factory()->create();

        $this->assertTrue($executive->can('create', Division::class));
        $this->assertFalse($pm->can('create', Division::class));
        $this->assertFalse($member->can('create', Division::class));
    }

    public function test_only_executive_can_delete_division(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $division = Division::create(['name' => 'HR']);

        $this->assertTrue($executive->can('delete', $division));
        $this->assertFalse($pm->can('delete', $division));
    }

    // --- Team Policy ---

    public function test_executive_and_pm_can_create_team(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $member = User::factory()->create();

        $this->assertTrue($executive->can('create', Team::class));
        $this->assertTrue($pm->can('create', Team::class));
        $this->assertFalse($member->can('create', Team::class));
    }

    public function test_team_lead_can_update_own_team(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $lead = User::factory()->create();
        $team = Team::create([
            'name' => 'Backend',
            'division_id' => $division->id,
            'team_lead_id' => $lead->id,
        ]);

        $this->assertTrue($lead->can('update', $team));
    }

    public function test_regular_member_cannot_update_team(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $member = User::factory()->create();
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);

        $this->assertFalse($member->can('update', $team));
    }

    public function test_team_lead_can_manage_members(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $lead = User::factory()->create();
        $team = Team::create([
            'name' => 'Backend',
            'division_id' => $division->id,
            'team_lead_id' => $lead->id,
        ]);

        $this->assertTrue($lead->can('manageMembers', $team));
    }

    public function test_only_executive_can_delete_team(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);

        $this->assertTrue($executive->can('delete', $team));
        $this->assertFalse($pm->can('delete', $team));
    }

    // --- User Policy ---

    public function test_executive_and_pm_can_view_all_users(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $member = User::factory()->create();

        $this->assertTrue($executive->can('viewAny', User::class));
        $this->assertTrue($pm->can('viewAny', User::class));
        $this->assertFalse($member->can('viewAny', User::class));
    }

    public function test_user_can_view_own_profile(): void
    {
        $member = User::factory()->create();

        $this->assertTrue($member->can('view', $member));
    }

    public function test_regular_member_cannot_view_other_profiles(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();

        $this->assertFalse($member->can('view', $other));
    }

    public function test_only_executive_can_change_roles(): void
    {
        $executive = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $target = User::factory()->create();

        $this->assertTrue($executive->can('updateRole', $target));
        $this->assertFalse($pm->can('updateRole', $target));
    }

    public function test_cannot_change_own_role(): void
    {
        $executive = User::factory()->executive()->create();

        $this->assertFalse($executive->can('updateRole', $executive));
    }

    public function test_cannot_deactivate_self(): void
    {
        $executive = User::factory()->executive()->create();

        $this->assertFalse($executive->can('deactivate', $executive));
    }

    public function test_executive_can_deactivate_others(): void
    {
        $executive = User::factory()->executive()->create();
        $target = User::factory()->create();

        $this->assertTrue($executive->can('deactivate', $target));
    }

    // --- Deactivated User Middleware ---

    public function test_deactivated_user_is_logged_out(): void
    {
        $user = User::factory()->deactivated()->create();

        $response = $this->actingAs($user)->get('/');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_active_user_can_access_app(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/');

        $response->assertStatus(200);
    }
}
