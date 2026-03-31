<?php

declare(strict_types=1);

namespace Tests\Feature\Work;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_member_can_view_tasks(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/tasks");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Work/Tasks/Index'));
    }

    public function test_non_member_cannot_view_tasks(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}/tasks");

        $response->assertForbidden();
    }

    public function test_member_can_create_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/tasks", [
            'title' => 'Implementovat login',
            'status' => 'backlog',
            'priority' => 'medium',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'title' => 'Implementovat login',
            'priority' => 'medium',
        ]);
    }

    public function test_member_can_create_task_in_epic(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/epics/{$epic->id}/tasks", [
            'title' => 'Úkol v epiku',
            'status' => 'backlog',
            'priority' => 'high',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'title' => 'Úkol v epiku',
        ]);
    }

    public function test_reader_cannot_create_task(): void
    {
        $reader = User::factory()->reader()->create();
        $project = Project::factory()->create();
        $project->members()->attach($reader->id, ['role' => 'member']);

        $response = $this->actingAs($reader)->post("/projects/{$project->id}/tasks", [
            'title' => 'Nemá projít',
            'status' => 'backlog',
            'priority' => 'medium',
        ]);

        $response->assertForbidden();
    }

    public function test_member_can_view_task_detail(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/tasks/{$task->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Work/Tasks/Show'));
    }

    public function test_member_can_update_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->put("/projects/{$project->id}/tasks/{$task->id}", [
            'title' => 'Aktualizovaný úkol',
            'status' => 'in_progress',
            'priority' => 'high',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Aktualizovaný úkol', $task->fresh()->title);
    }

    public function test_only_executive_pm_or_owner_can_delete_task(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $pm = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($member->id, ['role' => 'member']);
        $task = Task::factory()->create(['project_id' => $project->id]);

        // Regular member cannot delete
        $this->actingAs($member)->delete("/projects/{$project->id}/tasks/{$task->id}")
            ->assertForbidden();

        // PM can delete
        $this->actingAs($pm)->delete("/projects/{$project->id}/tasks/{$task->id}")
            ->assertRedirect();

        $this->assertSoftDeleted($task);

        // Owner can delete too
        $task2 = Task::factory()->create(['project_id' => $project->id]);
        $this->actingAs($owner)->delete("/projects/{$project->id}/tasks/{$task2->id}")
            ->assertRedirect();

        $this->assertSoftDeleted($task2);
    }

    public function test_task_creation_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $this->post("/projects/{$project->id}/tasks", [
            'title' => 'Auditovaný úkol',
            'status' => 'backlog',
            'priority' => 'medium',
        ]);

        $task = Task::where('title', 'Auditovaný úkol')->first();
        $entry = AuditEntry::where('entity_type', Task::class)
            ->where('entity_id', $task->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertNotNull($entry);
    }

    public function test_task_belongs_to_project_and_epic(): void
    {
        $project = Project::factory()->create();
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'epic_id' => $epic->id,
        ]);

        $this->assertEquals($project->id, $task->project->id);
        $this->assertEquals($epic->id, $task->epic->id);
        $this->assertCount(1, $project->tasks);
        $this->assertCount(1, $epic->tasks);
    }

    public function test_task_can_exist_without_epic(): void
    {
        $project = Project::factory()->create();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'epic_id' => null,
        ]);

        $this->assertNull($task->epic);
        $this->assertCount(1, $project->tasks);
    }
}
