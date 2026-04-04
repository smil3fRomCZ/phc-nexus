<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Organization\Models\Division;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Division>
 */
class DivisionFactory extends Factory
{
    protected $model = Division::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
