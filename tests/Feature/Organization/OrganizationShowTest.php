<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_organization_index_contains_stats(): void
    {
        $user = User::factory()->executive()->create();

        $response = $this->actingAs($user)->get('/admin/organization');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Organization/Index')
            ->has('stats')
            ->has('divisions'));
    }

    public function test_can_view_division_detail(): void
    {
        $user = User::factory()->executive()->create();
        $division = Division::factory()->create();

        $response = $this->actingAs($user)->get("/admin/organization/divisions/{$division->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Organization/DivisionShow')
            ->has('division'));
    }

    public function test_division_detail_contains_teams(): void
    {
        $user = User::factory()->executive()->create();
        $division = Division::factory()->create();
        Team::factory()->create(['division_id' => $division->id]);

        $response = $this->actingAs($user)->get("/admin/organization/divisions/{$division->id}");

        $response->assertInertia(fn ($page) => $page
            ->has('division.teams', 1));
    }

    public function test_can_view_team_detail(): void
    {
        $user = User::factory()->executive()->create();
        $division = Division::factory()->create();
        $team = Team::factory()->create(['division_id' => $division->id]);

        $response = $this->actingAs($user)->get("/admin/organization/teams/{$team->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Organization/TeamShow')
            ->has('team'));
    }

    public function test_team_detail_contains_members(): void
    {
        $user = User::factory()->executive()->create();
        $division = Division::factory()->create();
        $team = Team::factory()->create(['division_id' => $division->id]);
        User::factory()->create(['team_id' => $team->id]);

        $response = $this->actingAs($user)->get("/admin/organization/teams/{$team->id}");

        $response->assertInertia(fn ($page) => $page
            ->has('team.members', 1));
    }
}
