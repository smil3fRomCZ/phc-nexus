<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WikiPage>
 */
class WikiPageFactory extends Factory
{
    protected $model = WikiPage::class;

    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'epic_id' => null,
            'parent_id' => null,
            'title' => fake()->sentence(3),
            'content' => fake()->optional()->paragraphs(2, true),
            'author_id' => User::factory(),
            'position' => 0,
        ];
    }

    public function withContent(): static
    {
        return $this->state(fn () => ['content' => fake()->paragraphs(3, true)]);
    }
}
