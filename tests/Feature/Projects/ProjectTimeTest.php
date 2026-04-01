<?php

declare(strict_types=1);

namespace Tests\Feature\Projects;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectTimeTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_member_can_view_time_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/time");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Projects/Time')
            ->has('project')
            ->has('timeEntries')
            ->has('totalHours')
        );
    }

    public function test_non_member_cannot_view_time_page(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get("/projects/{$project->id}/time");

        $response->assertForbidden();
    }

    public function test_unauthenticated_user_is_redirected(): void
    {
        $project = Project::factory()->create();

        $response = $this->get("/projects/{$project->id}/time");

        $response->assertRedirect('/login');
    }
}
