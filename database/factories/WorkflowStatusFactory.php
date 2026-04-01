<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WorkflowStatus>
 */
class WorkflowStatusFactory extends Factory
{
    protected $model = WorkflowStatus::class;

    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'project_id' => Project::factory(),
            'name' => $name,
            'slug' => Str::slug($name),
            'color' => fake()->hexColor(),
            'position' => 0,
            'pos_x' => 0,
            'pos_y' => 0,
            'is_initial' => false,
            'is_done' => false,
            'is_cancelled' => false,
            'allow_transition_from_any' => false,
        ];
    }

    public function initial(): static
    {
        return $this->state(fn () => ['is_initial' => true]);
    }

    public function done(): static
    {
        return $this->state(fn () => ['is_done' => true]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['is_cancelled' => true]);
    }

    public function globalTarget(): static
    {
        return $this->state(fn () => ['allow_transition_from_any' => true]);
    }
}
