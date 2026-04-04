<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    protected $model = Team::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'division_id' => Division::factory(),
        ];
    }
}
