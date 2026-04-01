<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'epic_id' => null,
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'status' => TaskStatus::Backlog,
            'priority' => TaskPriority::Medium,
            'data_classification' => 'non_phi',
            'assignee_id' => null,
            'reporter_id' => null,
            'sort_order' => 0,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Task $task) {
            if ($task->workflow_status_id !== null) {
                return;
            }

            /** @var Project $project */
            $project = $task->project_id instanceof Project
                ? $task->project_id
                : Project::find($task->project_id);

            if (! $project) {
                return;
            }

            // Seed default workflow pokud projekt nemá žádné statuses
            if ($project->workflowStatuses()->count() === 0) {
                WorkflowController::seedDefaultWorkflow($project);
            }

            /** @var WorkflowStatus|null $initialStatus */
            $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();
            $task->workflow_status_id = $initialStatus?->id ?? $project->workflowStatuses()->orderBy('position')->value('id');
        });
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['status' => TaskStatus::InProgress]);
    }

    public function done(): static
    {
        return $this->state(fn () => ['status' => TaskStatus::Done]);
    }

    public function highPriority(): static
    {
        return $this->state(fn () => ['priority' => TaskPriority::High]);
    }

    public function urgent(): static
    {
        return $this->state(fn () => ['priority' => TaskPriority::Urgent]);
    }
}
