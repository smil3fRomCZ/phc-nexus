<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Modules\Projects\Enums\ProjectStatus;
use App\Modules\Projects\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'key' => Str::upper(Str::random(4)),
            'description' => fake()->optional()->paragraph(),
            'status' => ProjectStatus::Draft,
            'data_classification' => 'non_phi',
            'owner_id' => User::factory(),
            'team_id' => null,
            'start_date' => null,
            'target_date' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => ProjectStatus::Active]);
    }

    public function phi(): static
    {
        return $this->state(fn () => ['data_classification' => 'phi']);
    }
}
