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

class EpicCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_member_can_view_epics(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Work/Epics/Index'));
    }

    public function test_non_member_cannot_view_epics(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics");

        $response->assertForbidden();
    }

    public function test_member_can_create_epic(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->post("/projects/{$project->id}/epics", [
            'title' => 'User Authentication',
            'status' => 'backlog',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('epics', [
            'project_id' => $project->id,
            'title' => 'User Authentication',
        ]);
    }

    public function test_reader_cannot_create_epic(): void
    {
        $reader = User::factory()->reader()->create();
        $project = Project::factory()->create();
        $project->members()->attach($reader->id, ['role' => 'contributor']);

        $response = $this->actingAs($reader)->post("/projects/{$project->id}/epics", [
            'title' => 'Should fail',
            'status' => 'backlog',
        ]);

        $response->assertForbidden();
    }

    public function test_member_can_view_epic_detail(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/epics/{$epic->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Work/Epics/Show'));
    }

    public function test_member_can_update_epic(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->put("/projects/{$project->id}/epics/{$epic->id}", [
            'title' => 'Updated Epic',
            'status' => 'in_progress',
        ]);

        $response->assertRedirect();
        $this->assertEquals('Updated Epic', $epic->fresh()->title);
    }

    public function test_only_executive_or_pm_can_delete_epic(): void
    {
        $member = User::factory()->create();
        $pm = User::factory()->projectManager()->create();
        $project = Project::factory()->create(['owner_id' => $member->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $this->actingAs($member)->delete("/projects/{$project->id}/epics/{$epic->id}")
            ->assertForbidden();

        $this->actingAs($pm)->delete("/projects/{$project->id}/epics/{$epic->id}")
            ->assertRedirect();

        $this->assertSoftDeleted($epic);
    }

    public function test_epic_creation_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $this->post("/projects/{$project->id}/epics", [
            'title' => 'Audited Epic',
            'status' => 'backlog',
        ]);

        $epic = Epic::where('title', 'Audited Epic')->first();
        $entry = AuditEntry::where('entity_type', Epic::class)
            ->where('entity_id', $epic->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertNotNull($entry);
    }

    public function test_epic_belongs_to_project(): void
    {
        $project = Project::factory()->create();
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $this->assertEquals($project->id, $epic->project?->getAttribute('id'));
        $this->assertCount(1, $project->epics);
    }

    public function test_member_can_attach_existing_tasks_to_epic(): void
    {
        // IPA-8: hromadný attach úkolů k epicu jedním requestem.
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $taskA = Task::factory()->create(['project_id' => $project->id, 'epic_id' => null]);
        $taskB = Task::factory()->create(['project_id' => $project->id, 'epic_id' => null]);

        $response = $this->actingAs($user)->post(
            "/projects/{$project->id}/epics/{$epic->id}/attach-tasks",
            ['task_ids' => [$taskA->id, $taskB->id]],
        );

        $response->assertRedirect();
        $this->assertEquals($epic->id, $taskA->fresh()->epic_id);
        $this->assertEquals($epic->id, $taskB->fresh()->epic_id);
    }

    public function test_attach_tasks_requires_at_least_one_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->post(
            "/projects/{$project->id}/epics/{$epic->id}/attach-tasks",
            ['task_ids' => []],
        );

        $response->assertSessionHasErrors(['task_ids']);
    }

    public function test_attach_tasks_only_affects_tasks_from_same_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $otherProject = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $foreignTask = Task::factory()->create(['project_id' => $otherProject->id, 'epic_id' => null]);

        $this->actingAs($user)->post(
            "/projects/{$project->id}/epics/{$epic->id}/attach-tasks",
            ['task_ids' => [$foreignTask->id]],
        );

        // Cizí úkol nesmí být přiřazen — bulk update je scoped na project_id v query.
        $this->assertNull($foreignTask->fresh()->epic_id);
    }

    public function test_non_member_cannot_attach_tasks_to_epic(): void
    {
        // Uživatel není členem projektu — nesmí přiřazovat úkoly v cizím epicu.
        $outsider = User::factory()->create();
        $project = Project::factory()->create();
        $epic = Epic::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'epic_id' => null]);

        $response = $this->actingAs($outsider)->post(
            "/projects/{$project->id}/epics/{$epic->id}/attach-tasks",
            ['task_ids' => [$task->id]],
        );

        $response->assertForbidden();
        $this->assertNull($task->fresh()->epic_id);
    }
}
