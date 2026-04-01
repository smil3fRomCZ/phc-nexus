<?php

declare(strict_types=1);

namespace Tests\Feature\Work;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Projects\Models\WorkflowTransition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_workflow_editor(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/workflow");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Projects/Workflow'));
    }

    public function test_non_member_cannot_view_workflow(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}/workflow");

        $response->assertForbidden();
    }

    public function test_owner_can_create_workflow_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/workflow/statuses", [
            'name' => 'In Review',
            'color' => '#ff9900',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('workflow_statuses', [
            'project_id' => $project->id,
            'name' => 'In Review',
            'slug' => 'in-review',
        ]);
    }

    public function test_owner_can_update_workflow_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $status = WorkflowStatus::factory()->create(['project_id' => $project->id, 'name' => 'Old']);

        $response = $this->actingAs($user)->putJson("/projects/{$project->id}/workflow/statuses/{$status->id}", [
            'name' => 'New Name',
            'color' => '#00ff00',
            'is_initial' => true,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('workflow_statuses', [
            'id' => $status->id,
            'name' => 'New Name',
            'is_initial' => true,
        ]);
    }

    public function test_owner_can_delete_workflow_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $status = WorkflowStatus::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->deleteJson("/projects/{$project->id}/workflow/statuses/{$status->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('workflow_statuses', ['id' => $status->id]);
    }

    public function test_owner_can_create_transition(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $to = WorkflowStatus::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/workflow/transitions", [
            'from_status_id' => $from->id,
            'to_status_id' => $to->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('workflow_transitions', [
            'project_id' => $project->id,
            'from_status_id' => $from->id,
            'to_status_id' => $to->id,
        ]);
    }

    public function test_owner_can_delete_transition(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $to = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $transition = WorkflowTransition::create([
            'project_id' => $project->id,
            'from_status_id' => $from->id,
            'to_status_id' => $to->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/projects/{$project->id}/workflow/transitions/{$transition->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('workflow_transitions', ['id' => $transition->id]);
    }

    public function test_can_transition_to_explicit_target(): void
    {
        $project = Project::factory()->create();
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $to = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        WorkflowTransition::create([
            'project_id' => $project->id,
            'from_status_id' => $from->id,
            'to_status_id' => $to->id,
        ]);

        $this->assertTrue($from->canTransitionTo($to));
    }

    public function test_cannot_transition_without_defined_transition(): void
    {
        $project = Project::factory()->create();
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $to = WorkflowStatus::factory()->create(['project_id' => $project->id]);

        $this->assertFalse($from->canTransitionTo($to));
    }

    public function test_can_transition_to_global_target(): void
    {
        $project = Project::factory()->create();
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id]);
        $to = WorkflowStatus::factory()->globalTarget()->create(['project_id' => $project->id]);

        $this->assertTrue($from->canTransitionTo($to));
    }

    public function test_allowed_targets_includes_explicit_and_global(): void
    {
        $project = Project::factory()->create();
        $from = WorkflowStatus::factory()->create(['project_id' => $project->id, 'position' => 0]);
        $explicit = WorkflowStatus::factory()->create(['project_id' => $project->id, 'position' => 1]);
        $global = WorkflowStatus::factory()->globalTarget()->create(['project_id' => $project->id, 'position' => 2]);
        WorkflowStatus::factory()->create(['project_id' => $project->id, 'position' => 3]); // unreachable

        WorkflowTransition::create([
            'project_id' => $project->id,
            'from_status_id' => $from->id,
            'to_status_id' => $explicit->id,
        ]);

        $targets = $from->allowedTargets();
        $this->assertCount(2, $targets);
        $this->assertTrue($targets->contains('id', $explicit->id));
        $this->assertTrue($targets->contains('id', $global->id));
    }
}
