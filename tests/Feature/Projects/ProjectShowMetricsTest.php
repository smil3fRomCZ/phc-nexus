<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectShowMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_show_includes_task_metrics(): void
    {
        $user = User::factory()->executive()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $project->members()->attach($user->id, ['role' => 'owner']);
        WorkflowController::seedDefaultWorkflow($project);

        $doneStatus = $project->workflowStatuses()->where('is_done', true)->first();
        $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();

        // 3 tasks: 1 done, 1 overdue, 1 backlog
        Task::factory()->for($project)->create(['workflow_status_id' => $doneStatus->id]);
        Task::factory()->for($project)->create([
            'workflow_status_id' => $initialStatus->id,
            'due_date' => now()->subDay(),
        ]);
        Task::factory()->for($project)->create(['workflow_status_id' => $initialStatus->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Show')
            ->where('project.tasks_count', 3)
            ->where('project.tasks_completed_count', 1)
            ->where('project.tasks_overdue_count', 1)
        );
    }

    public function test_project_show_includes_epics_and_members_count(): void
    {
        $user = User::factory()->executive()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $project->members()->attach($user->id, ['role' => 'owner']);
        $project->members()->attach($member->id, ['role' => 'contributor']);

        Epic::factory()->for($project)->count(2)->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}");

        $response->assertInertia(fn ($page) => $page
            ->where('project.epics_count', 2)
            ->where('project.members_count', 2)
        );
    }
}
