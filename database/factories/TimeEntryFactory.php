<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimeEntry>
 */
class TimeEntryFactory extends Factory
{
    protected $model = TimeEntry::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'task_id' => null,
            'epic_id' => null,
            'user_id' => User::factory(),
            'date' => fake()->date(),
            'hours' => fake()->randomFloat(2, 0.25, 8),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
