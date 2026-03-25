<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Models\Tribe;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_division_has_teams(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);

        $this->assertTrue($division->teams->contains($team));
    }

    public function test_team_belongs_to_division(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);

        $this->assertEquals($division->id, $team->division->id);
    }

    public function test_team_has_members(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);
        $user = User::factory()->create(['team_id' => $team->id]);

        $this->assertTrue($team->members->contains($user));
    }

    public function test_team_has_team_lead(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $lead = User::factory()->create();
        $team = Team::create([
            'name' => 'Backend',
            'division_id' => $division->id,
            'team_lead_id' => $lead->id,
        ]);

        $this->assertEquals($lead->id, $team->teamLead->id);
    }

    public function test_user_belongs_to_team(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);
        $user = User::factory()->create(['team_id' => $team->id]);

        $this->assertEquals($team->id, $user->team->id);
    }

    public function test_user_has_system_role(): void
    {
        $user = User::factory()->executive()->create();

        $this->assertEquals(SystemRole::Executive, $user->system_role);
        $this->assertTrue($user->isExecutive());
        $this->assertFalse($user->isProjectManager());
    }

    public function test_user_has_status(): void
    {
        $user = User::factory()->create();

        $this->assertEquals(UserStatus::Active, $user->status);
        $this->assertTrue($user->isActive());
    }

    public function test_deactivated_user(): void
    {
        $user = User::factory()->deactivated()->create();

        $this->assertEquals(UserStatus::Deactivated, $user->status);
        $this->assertFalse($user->isActive());
    }

    public function test_tribe_has_members(): void
    {
        $tribe = Tribe::create(['name' => 'Design System']);
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $tribe->members()->attach([$user1->id, $user2->id]);

        $this->assertCount(2, $tribe->members);
    }

    public function test_user_belongs_to_multiple_tribes(): void
    {
        $tribe1 = Tribe::create(['name' => 'Design System']);
        $tribe2 = Tribe::create(['name' => 'Security']);
        $user = User::factory()->create();

        $user->tribes()->attach([$tribe1->id, $tribe2->id]);

        $this->assertCount(2, $user->tribes);
    }

    public function test_division_has_members_through_teams(): void
    {
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Backend', 'division_id' => $division->id]);
        User::factory()->count(3)->create(['team_id' => $team->id]);

        $this->assertCount(3, $division->members);
    }

    public function test_all_system_roles_have_labels(): void
    {
        foreach (SystemRole::cases() as $role) {
            $this->assertNotEmpty($role->label());
        }
    }
}
