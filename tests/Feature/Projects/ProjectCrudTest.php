<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    // --- Index ---

    public function test_executive_sees_all_projects(): void
    {
        $exec = User::factory()->executive()->create();
        Project::factory()->count(3)->create();

        $response = $this->actingAs($exec)->get('/projects');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Index')
            ->has('projects.data', 3)
        );
    }

    public function test_member_sees_only_own_projects(): void
    {
        $member = User::factory()->create();
        $other = User::factory()->create();

        $ownProject = Project::factory()->create(['owner_id' => $member->id]);
        $memberProject = Project::factory()->create();
        $memberProject->members()->attach($member->id, ['role' => 'contributor']);
        Project::factory()->create(['owner_id' => $other->id]);

        $response = $this->actingAs($member)->get('/projects');

        $response->assertInertia(fn ($page) => $page->has('projects.data', 2));
    }

    // --- Create ---

    public function test_executive_can_create_project(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post('/projects', [
            'name' => 'PHC Platform',
            'key' => 'PHC',
            'status' => 'draft',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('projects', ['name' => 'PHC Platform', 'key' => 'PHC']);

        $project = Project::where('key', 'PHC')->first();
        $this->assertTrue($project->hasMember($exec));
    }

    public function test_member_cannot_create_project(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->post('/projects', [
            'name' => 'Test',
            'key' => 'TST',
            'status' => 'draft',
        ]);

        $response->assertForbidden();
    }

    public function test_project_key_must_be_unique(): void
    {
        $exec = User::factory()->executive()->create();
        Project::factory()->create(['key' => 'PHC']);

        $response = $this->actingAs($exec)->post('/projects', [
            'name' => 'Duplicate',
            'key' => 'PHC',
            'status' => 'draft',
        ]);

        $response->assertSessionHasErrors('key');
    }

    public function test_project_key_format_validated(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post('/projects', [
            'name' => 'Test',
            'key' => 'lower',
            'status' => 'draft',
        ]);

        $response->assertSessionHasErrors('key');
    }

    // --- Show ---

    public function test_member_can_view_own_project(): void
    {
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $member->id]);

        $response = $this->actingAs($member)->get("/projects/{$project->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Projects/Show'));
    }

    public function test_non_member_cannot_view_project(): void
    {
        $member = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($member)->get("/projects/{$project->id}");

        $response->assertForbidden();
    }

    public function test_reader_cannot_view_phi_project(): void
    {
        $reader = User::factory()->reader()->create();
        $project = Project::factory()->create(['data_classification' => PhiClassification::Phi->value]);
        $project->members()->attach($reader->id, ['role' => 'contributor']);

        $response = $this->actingAs($reader)->get("/projects/{$project->id}");

        $response->assertForbidden();
    }

    // --- Update ---

    public function test_pm_member_can_update_project(): void
    {
        $pm = User::factory()->projectManager()->create();
        $project = Project::factory()->create();
        $project->members()->attach($pm->id, ['role' => 'contributor']);

        $response = $this->actingAs($pm)->put("/projects/{$project->id}", [
            'name' => 'Updated Name',
            'status' => 'active',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Updated Name', $project->fresh()->name);
    }

    public function test_member_cannot_update_project(): void
    {
        $member = User::factory()->create();
        $project = Project::factory()->create();
        $project->members()->attach($member->id, ['role' => 'contributor']);

        $response = $this->actingAs($member)->put("/projects/{$project->id}", [
            'name' => 'Hacked',
            'status' => 'active',
        ]);

        $response->assertForbidden();
    }

    // --- Delete ---

    public function test_only_executive_can_delete_project(): void
    {
        $exec = User::factory()->executive()->create();
        $pm = User::factory()->projectManager()->create();
        $project = Project::factory()->create();

        $this->actingAs($pm)->delete("/projects/{$project->id}")->assertForbidden();
        $this->actingAs($exec)->delete("/projects/{$project->id}")->assertRedirect('/projects');
        $this->assertSoftDeleted($project);
    }

    // --- Audit ---

    public function test_project_creation_is_audited(): void
    {
        $exec = User::factory()->executive()->create();
        $this->actingAs($exec);

        $this->post('/projects', [
            'name' => 'Audited Project',
            'key' => 'AUD',
            'status' => 'draft',
        ]);

        $project = Project::where('key', 'AUD')->first();
        $entry = AuditEntry::where('entity_type', Project::class)
            ->where('entity_id', $project->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertNotNull($entry);
    }
}
