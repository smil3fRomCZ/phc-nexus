<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Models\Epic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Epic>
 */
class EpicFactory extends Factory
{
    protected $model = Epic::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'status' => EpicStatus::Backlog,
            'data_classification' => 'non_phi',
            'owner_id' => null,
            'sort_order' => 0,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn () => ['status' => EpicStatus::InProgress]);
    }

    public function done(): static
    {
        return $this->state(fn () => ['status' => EpicStatus::Done]);
    }
}
