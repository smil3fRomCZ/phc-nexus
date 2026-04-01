<?php

declare(strict_types=1);

namespace Tests\Feature\Work;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_log_time_on_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/tasks/{$task->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 2.5,
            'note' => 'Implementace',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('time_entries', [
            'project_id' => $project->id,
            'task_id' => $task->id,
            'user_id' => $user->id,
            'hours' => '2.50',
            'note' => 'Implementace',
        ]);
    }

    public function test_member_can_log_time_on_epic(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $epic = Epic::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/epics/{$epic->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 1.0,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('time_entries', [
            'project_id' => $project->id,
            'epic_id' => $epic->id,
            'task_id' => null,
            'user_id' => $user->id,
        ]);
    }

    public function test_member_can_log_time_on_project(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 0.5,
            'note' => 'Meeting',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('time_entries', [
            'project_id' => $project->id,
            'task_id' => null,
            'epic_id' => null,
        ]);
    }

    public function test_non_member_cannot_log_time(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 1.0,
        ]);

        $response->assertForbidden();
    }

    public function test_validates_minimum_hours(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 0.1,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('hours');
    }

    public function test_validates_maximum_hours(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->postJson("/projects/{$project->id}/time-entries", [
            'date' => '2026-04-01',
            'hours' => 25,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('hours');
    }

    public function test_owner_can_delete_own_time_entry(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $entry = TimeEntry::factory()->create([
            'project_id' => $project->id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/time-entries/{$entry->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('time_entries', ['id' => $entry->id]);
    }

    public function test_user_cannot_delete_other_users_time_entry(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $entry = TimeEntry::factory()->create([
            'project_id' => $project->id,
            'user_id' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)->deleteJson("/time-entries/{$entry->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('time_entries', ['id' => $entry->id]);
    }
}
