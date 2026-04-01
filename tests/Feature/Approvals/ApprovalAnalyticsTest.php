<?php

declare(strict_types=1);

namespace Tests\Feature\Approvals;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_executive_can_view_approval_analytics(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->get('/admin/approval-analytics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/ApprovalAnalytics/Index')
            ->has('stats')
            ->has('history')
        );
    }

    public function test_pm_can_view_approval_analytics(): void
    {
        $pm = User::factory()->projectManager()->create();

        $response = $this->actingAs($pm)->get('/admin/approval-analytics');

        $response->assertStatus(200);
    }

    public function test_member_cannot_view_approval_analytics(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->get('/admin/approval-analytics');

        $response->assertForbidden();
    }

    public function test_analytics_includes_project_id(): void
    {
        $exec = User::factory()->executive()->create();
        $task = Task::factory()->create();

        ApprovalRequest::factory()->create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'requester_id' => $exec->id,
        ]);

        $response = $this->actingAs($exec)->get('/admin/approval-analytics');

        $response->assertInertia(fn ($page) => $page
            ->has('history', 1)
            ->where('history.0.project_id', $task->project_id)
        );
    }

    public function test_resolution_hours_are_never_negative(): void
    {
        $exec = User::factory()->executive()->create();
        $task = Task::factory()->create();

        ApprovalRequest::factory()->create([
            'approvable_type' => Task::class,
            'approvable_id' => $task->id,
            'requester_id' => $exec->id,
            'status' => 'approved',
            'decided_at' => now(),
        ]);

        $response = $this->actingAs($exec)->get('/admin/approval-analytics');

        $response->assertInertia(fn ($page) => $page
            ->where('stats.avg_resolution_hours', fn ($val) => $val >= 0)
        );
    }
}
