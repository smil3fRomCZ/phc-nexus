<?php

declare(strict_types=1);

namespace Tests\Feature\Work;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskBoardTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_view_kanban_board(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(3)->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/board");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Work/Tasks/Board')
            ->has('columns', 5)
        );
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
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(3)->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Work/Tasks/Table')
            ->has('tasks', 3)
        );
    }

    public function test_table_filters_by_status(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog']);
        Task::factory()->create(['project_id' => $project->id, 'status' => 'in_progress']);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table?status=backlog");

        $response->assertInertia(fn ($page) => $page->has('tasks', 1));
    }

    public function test_table_filters_by_priority(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->create(['project_id' => $project->id, 'priority' => 'high']);
        Task::factory()->create(['project_id' => $project->id, 'priority' => 'low']);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/table?priority=high");

        $response->assertInertia(fn ($page) => $page->has('tasks', 1));
    }

    public function test_valid_status_transition_via_patch(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'backlog',
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => 'todo',
            ]);

        $response->assertOk();
        $this->assertEquals(TaskStatus::Todo, $task->fresh()->status);
    }

    public function test_invalid_status_transition_rejected(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'backlog',
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => 'done',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('status');
        $this->assertEquals(TaskStatus::Backlog, $task->fresh()->status);
    }

    public function test_status_transition_requires_authorization(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $task = Task::factory()->create(['project_id' => $project->id]);

        $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => 'todo',
            ])
            ->assertForbidden();
    }

    public function test_done_can_reopen_to_in_progress(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->done()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => 'in_progress',
            ]);

        $response->assertOk();
        $this->assertEquals(TaskStatus::InProgress, $task->fresh()->status);
    }

    public function test_cancelled_can_reopen_to_backlog(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'status' => 'cancelled',
        ]);

        $response = $this->actingAs($user)
            ->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
                'status' => 'backlog',
            ]);

        $response->assertOk();
        $this->assertEquals(TaskStatus::Backlog, $task->fresh()->status);
    }
}
