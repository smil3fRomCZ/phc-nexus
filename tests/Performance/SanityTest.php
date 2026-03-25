<?php

declare(strict_types=1);

namespace Tests\Performance;

use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Výkonové sanity testy — ověřují, že klíčové endpointy odpovídají
 * v rozumném čase. Nejsou load testy, jen baseline.
 *
 * Threshold: 500ms per request (s DB, bez cache).
 */
class SanityTest extends TestCase
{
    use RefreshDatabase;

    private const THRESHOLD_MS = 500;

    private function assertResponseTime(float $durationMs, string $endpoint): void
    {
        $this->assertLessThan(
            self::THRESHOLD_MS,
            $durationMs,
            "{$endpoint} odpověděl za {$durationMs}ms (limit: ".self::THRESHOLD_MS.'ms)',
        );
    }

    public function test_health_check_under_threshold(): void
    {
        $start = microtime(true);
        $this->get('/up')->assertOk();
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /up');
    }

    public function test_login_page_under_threshold(): void
    {
        $start = microtime(true);
        $this->get('/login');
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /login');
    }

    public function test_dashboard_under_threshold(): void
    {
        $user = User::factory()->create();

        $start = microtime(true);
        $this->actingAs($user)->get('/');
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET / (dashboard)');
    }

    public function test_projects_index_under_threshold(): void
    {
        $user = User::factory()->executive()->create();
        Project::factory()->count(20)->create();

        $start = microtime(true);
        $this->actingAs($user)->get('/projects');
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /projects (20 projektů)');
    }

    public function test_kanban_board_under_threshold(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(50)->create(['project_id' => $project->id]);

        $start = microtime(true);
        $this->actingAs($user)->get("/projects/{$project->id}/board");
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /projects/{id}/board (50 úkolů)');
    }

    public function test_table_view_under_threshold(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        Task::factory()->count(50)->create(['project_id' => $project->id]);

        $start = microtime(true);
        $this->actingAs($user)->get("/projects/{$project->id}/table");
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /projects/{id}/table (50 úkolů)');
    }

    public function test_task_status_change_under_threshold(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);
        $task = Task::factory()->create(['project_id' => $project->id, 'status' => 'backlog']);

        $start = microtime(true);
        $this->actingAs($user)->patchJson("/projects/{$project->id}/tasks/{$task->id}/status", [
            'status' => 'todo',
        ]);
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'PATCH /tasks/{id}/status');
    }

    public function test_notifications_index_under_threshold(): void
    {
        $user = User::factory()->create();

        $start = microtime(true);
        $this->actingAs($user)->get('/notifications');
        $duration = (microtime(true) - $start) * 1000;

        $this->assertResponseTime($duration, 'GET /notifications');
    }
}
