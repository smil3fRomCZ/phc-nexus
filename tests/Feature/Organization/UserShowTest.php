<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_executive_can_view_user_detail(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->get("/admin/users/{$target->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/Users/Show'));
    }

    public function test_pm_can_view_user_detail(): void
    {
        $pm = User::factory()->projectManager()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($pm)->get("/admin/users/{$target->id}");

        $response->assertStatus(200);
    }

    public function test_regular_member_cannot_view_other_user(): void
    {
        $member = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($member)->get("/admin/users/{$target->id}");

        $response->assertForbidden();
    }

    public function test_user_can_view_own_detail(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get("/admin/users/{$user->id}");

        $response->assertStatus(200);
    }

    public function test_show_page_contains_all_data(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->get("/admin/users/{$target->id}");

        $response->assertInertia(fn ($page) => $page
            ->has('user')
            ->has('directReports')
            ->has('teams')
            ->has('roles')
            ->has('can'));
    }

    public function test_executive_can_update_user(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$target->id}", [
            'system_role' => 'project_manager',
            'job_title' => 'PM Lead',
        ]);

        $response->assertRedirect();
        $this->assertEquals('project_manager', $target->fresh()->system_role->value);
        $this->assertEquals('PM Lead', $target->fresh()->job_title);
    }

    public function test_executive_can_change_team(): void
    {
        $exec = User::factory()->executive()->create();
        $division = Division::factory()->create();
        $team = Team::factory()->create(['division_id' => $division->id]);
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$target->id}", [
            'team_id' => $team->id,
        ]);

        $response->assertRedirect();
        $this->assertEquals($team->id, $target->fresh()->team_id);
    }

    public function test_non_executive_cannot_update_user(): void
    {
        $pm = User::factory()->projectManager()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($pm)->patch("/admin/users/{$target->id}", [
            'job_title' => 'Should fail',
        ]);

        $response->assertForbidden();
    }

    public function test_update_validates_team_exists(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$target->id}", [
            'team_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $response->assertSessionHasErrors('team_id');
    }
}
