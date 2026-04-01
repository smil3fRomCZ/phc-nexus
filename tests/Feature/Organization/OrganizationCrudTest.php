<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationCrudTest extends TestCase
{
    use RefreshDatabase;

    // ── Divisions ──

    public function test_executive_can_create_division(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post('/admin/divisions', [
            'name' => 'Engineering',
            'description' => 'Vývojové oddělení',
        ]);

        $response->assertRedirect(route('admin.organization'));
        $this->assertDatabaseHas('divisions', ['name' => 'Engineering']);
    }

    public function test_pm_cannot_create_division(): void
    {
        $pm = User::factory()->projectManager()->create();

        $response = $this->actingAs($pm)->post('/admin/divisions', [
            'name' => 'Engineering',
        ]);

        $response->assertForbidden();
    }

    public function test_executive_can_update_division(): void
    {
        $exec = User::factory()->executive()->create();
        $division = Division::create(['name' => 'Old Name']);

        $response = $this->actingAs($exec)->put("/admin/divisions/{$division->id}", [
            'name' => 'New Name',
            'description' => 'Updated',
        ]);

        $response->assertRedirect(route('admin.organization'));
        $this->assertEquals('New Name', $division->fresh()->name);
    }

    public function test_executive_can_delete_division(): void
    {
        $exec = User::factory()->executive()->create();
        $division = Division::create(['name' => 'To Delete']);

        $response = $this->actingAs($exec)->delete("/admin/divisions/{$division->id}");

        $response->assertRedirect(route('admin.organization'));
        $this->assertDatabaseMissing('divisions', ['id' => $division->id]);
    }

    public function test_division_name_is_required(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post('/admin/divisions', [
            'name' => '',
        ]);

        $response->assertSessionHasErrors('name');
    }

    // ── Teams ──

    public function test_executive_can_create_team(): void
    {
        $exec = User::factory()->executive()->create();
        $division = Division::create(['name' => 'Engineering']);

        $response = $this->actingAs($exec)->post('/admin/teams', [
            'name' => 'Backend',
            'division_id' => $division->id,
        ]);

        $response->assertRedirect(route('admin.organization'));
        $this->assertDatabaseHas('teams', ['name' => 'Backend', 'division_id' => $division->id]);
    }

    public function test_pm_can_create_team(): void
    {
        $pm = User::factory()->projectManager()->create();
        $division = Division::create(['name' => 'Engineering']);

        $response = $this->actingAs($pm)->post('/admin/teams', [
            'name' => 'Frontend',
            'division_id' => $division->id,
        ]);

        $response->assertRedirect(route('admin.organization'));
        $this->assertDatabaseHas('teams', ['name' => 'Frontend']);
    }

    public function test_member_cannot_create_team(): void
    {
        $member = User::factory()->create();
        $division = Division::create(['name' => 'Engineering']);

        $response = $this->actingAs($member)->post('/admin/teams', [
            'name' => 'Test',
            'division_id' => $division->id,
        ]);

        $response->assertForbidden();
    }

    public function test_executive_can_update_team_with_lead(): void
    {
        $exec = User::factory()->executive()->create();
        $lead = User::factory()->create();
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'Old', 'division_id' => $division->id]);

        $response = $this->actingAs($exec)->put("/admin/teams/{$team->id}", [
            'name' => 'Updated Team',
            'division_id' => $division->id,
            'team_lead_id' => $lead->id,
        ]);

        $response->assertRedirect(route('admin.organization'));
        $team->refresh();
        $this->assertEquals('Updated Team', $team->name);
        $this->assertEquals($lead->id, $team->team_lead_id);
    }

    public function test_executive_can_delete_team(): void
    {
        $exec = User::factory()->executive()->create();
        $division = Division::create(['name' => 'Engineering']);
        $team = Team::create(['name' => 'To Delete', 'division_id' => $division->id]);

        $response = $this->actingAs($exec)->delete("/admin/teams/{$team->id}");

        $response->assertRedirect(route('admin.organization'));
        $this->assertDatabaseMissing('teams', ['id' => $team->id]);
    }

    public function test_team_requires_division(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post('/admin/teams', [
            'name' => 'No Division',
        ]);

        $response->assertSessionHasErrors('division_id');
    }

    // ── Organization page ──

    public function test_organization_page_includes_users_and_permissions(): void
    {
        $exec = User::factory()->executive()->create();
        Division::create(['name' => 'Engineering']);

        $response = $this->actingAs($exec)->get('/admin/organization');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Organization/Index')
            ->has('divisions')
            ->has('users')
            ->has('can')
        );
    }
}
