<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Projects\Models\Project;
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
