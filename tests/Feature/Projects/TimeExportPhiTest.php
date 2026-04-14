<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeExportPhiTest extends TestCase
{
    use RefreshDatabase;

    public function test_time_export_excludes_entries_from_phi_tasks(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id,
            'data_classification' => 'non_phi',
        ]);

        $nonPhiTask = Task::factory()->for($project)->create([
            'data_classification' => 'non_phi',
            'reporter_id' => $user->id,
        ]);
        $phiTask = Task::factory()->for($project)->create([
            'data_classification' => 'phi',
            'reporter_id' => $user->id,
        ]);

        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $nonPhiTask->id,
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'hours' => 2,
            'note' => 'non-phi work',
        ]);
        TimeEntry::create([
            'project_id' => $project->id,
            'task_id' => $phiTask->id,
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'hours' => 3,
            'note' => 'sensitive patient data',
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/export/time?format=csv");

        $response->assertStatus(200);
        $body = $response->streamedContent();

        $this->assertStringContainsString('non-phi work', $body);
        $this->assertStringNotContainsString('sensitive patient data', $body);
    }

    public function test_task_time_export_blocks_phi_task(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create([
            'owner_id' => $user->id,
            'data_classification' => 'non_phi',
        ]);
        $phiTask = Task::factory()->for($project)->create([
            'data_classification' => 'phi',
            'reporter_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/tasks/{$phiTask->id}/export/time?format=csv");

        $response->assertForbidden();
    }
}
