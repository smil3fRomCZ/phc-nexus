<?php

declare(strict_types=1);

namespace Tests\Feature\Work;

use App\Models\User;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskBoardTest extends TestCase
{
    use RefreshDatabase;

    private function createProjectWithWorkflow(User $user): Project
    {
        $project = Project::factory()->create(['owner_id' => $user->id]);
        WorkflowController::seedDefaultWorkflow($project);

        return $project;
    }

    private function initialStatus(Project $project): WorkflowStatus
    {
        return $project->workflowStatuses()->where('is_initial', true)->firstOrFail();
    }

    private function statusBySlug(Project $project, string $slug): WorkflowStatus
    {
        return $project->workflowStatuses()->where('slug', $slug)->firstOrFail();
    }

    public function test_member_can_view_kanban_board(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $initial = $this->initialStatus($project);

        Task::factory()->count(3)->create([
            'project_id' => $project->id,
            'workflow_status_id' => $initial->id,
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/board");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Work/Tasks/Board'));
    }

    public function test_non_member_cannot_view_board(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($user)->get("/projects/{$project->id}/board")
            ->assertForbidden();
    }

    public function test_member_can_view_table(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $initial = $this->initialStatus($project);

        Task::factory()->count(3)->create([
            'project_id' => $project->id,
            'workflow_status_id' => $initial->id,
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Work/Tasks/Table')
            ->has('tasks', 3)
        );
    }

    public function test_table_filters_by_workflow_status(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $backlog = $this->statusBySlug($project, 'backlog');
        $inProgress = $this->statusBySlug($project, 'in_progress');

        Task::factory()->create(['project_id' => $project->id, 'workflow_status_id' => $backlog->id]);
        Task::factory()->create(['project_id' => $project->id, 'workflow_status_id' => $inProgress->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table?status={$backlog->id}");

        $response->assertInertia(fn ($page) => $page->has('tasks', 1));
    }

    public function test_table_filters_by_priority(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $initial = $this->initialStatus($project);

        Task::factory()->create(['project_id' => $project->id, 'workflow_status_id' => $initial->id, 'priority' => 'high']);
        Task::factory()->create(['project_id' => $project->id, 'workflow_status_id' => $initial->id, 'priority' => 'low']);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table?priority=high");

        $response->assertInertia(fn ($page) => $page->has('tasks', 1));
    }

    public function test_valid_status_transition_via_patch(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $backlog = $this->statusBySlug($project, 'backlog');
        $todo = $this->statusBySlug($project, 'todo');

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'workflow_status_id' => $backlog->id,
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => $todo->id,
            ]);

        $response->assertOk();
        $this->assertEquals($todo->id, $task->fresh()->workflow_status_id);
    }

    public function test_invalid_status_transition_rejected(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $backlog = $this->statusBySlug($project, 'backlog');
        $done = $this->statusBySlug($project, 'done');

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'workflow_status_id' => $backlog->id,
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => $done->id,
            ]);

        $response->assertStatus(422);
        $this->assertEquals($backlog->id, $task->fresh()->workflow_status_id);
    }

    public function test_status_transition_requires_authorization(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        WorkflowController::seedDefaultWorkflow($project);
        $initial = $this->initialStatus($project);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'workflow_status_id' => $initial->id,
        ]);

        $todo = $this->statusBySlug($project, 'todo');

        $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => $todo->id,
            ])
            ->assertForbidden();
    }

    public function test_done_can_reopen_to_in_progress(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $done = $this->statusBySlug($project, 'done');
        $inProgress = $this->statusBySlug($project, 'in_progress');

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'workflow_status_id' => $done->id,
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => $inProgress->id,
            ]);

        $response->assertOk();
        $this->assertEquals($inProgress->id, $task->fresh()->workflow_status_id);
    }

    public function test_cancelled_can_reopen_to_backlog(): void
    {
        $user = User::factory()->create();
        $project = $this->createProjectWithWorkflow($user);
        $cancelled = $this->statusBySlug($project, 'cancelled');
        $backlog = $this->statusBySlug($project, 'backlog');

        $task = Task::factory()->create([
            'project_id' => $project->id,
            'workflow_status_id' => $cancelled->id,
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => $backlog->id,
            ]);

        $response->assertOk();
        $this->assertEquals($backlog->id, $task->fresh()->workflow_status_id);
    }
}
