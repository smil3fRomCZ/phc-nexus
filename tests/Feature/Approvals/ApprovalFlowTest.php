<?php

declare(strict_types=1);

namespace Tests\Feature\Approvals;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    private function createApprovalSetup(): array
    {
        $requester = User::factory()->create();
        $approver1 = User::factory()->create();
        $approver2 = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $requester->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        return compact('requester', 'approver1', 'approver2', 'project', 'task');
    }

    public function test_member_can_create_approval_request(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $response = $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
            'description' => 'Prosím o schválení',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('approval_requests', [
            'approvable_id' => $task->id,
            'requester_id' => $requester->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('approval_votes', [
            'voter_id' => $approver1->id,
            'decision' => null,
        ]);
    }

    public function test_reader_cannot_create_approval(): void
    {
        $reader = User::factory()->reader()->create();
        $project = Project::factory()->create();
        $project->members()->attach($reader->id, ['role' => 'member']);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $response = $this->actingAs($reader)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [User::factory()->create()->id],
        ]);

        $response->assertForbidden();
    }

    public function test_approver_can_approve(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        // Vytvoř request
        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
            'description' => 'Test approval',
        ]);

        $approval = ApprovalRequest::first();

        // Approver hlasuje
        $response = $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
            'comment' => 'Vypadá dobře',
        ]);

        $response->assertRedirect();
        $this->assertEquals(ApprovalStatus::Approved, $approval->fresh()->status);
    }

    public function test_any_reject_blocks_entire_request(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'approver2' => $approver2, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id, $approver2->id],
        ]);

        $approval = ApprovalRequest::first();

        // Approver 1 zamítne
        $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'rejected',
        ]);

        // Request je hned rejected
        $this->assertEquals(ApprovalStatus::Rejected, $approval->fresh()->status);
        $this->assertNotNull($approval->fresh()->decided_at);
    }

    public function test_all_must_approve_for_approval(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'approver2' => $approver2, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id, $approver2->id],
        ]);

        $approval = ApprovalRequest::first();

        // Approver 1 schválí — ještě pending
        $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);
        $this->assertEquals(ApprovalStatus::Pending, $approval->fresh()->status);

        // Approver 2 schválí — teď approved
        $this->actingAs($approver2)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);
        $this->assertEquals(ApprovalStatus::Approved, $approval->fresh()->status);
    }

    public function test_non_approver_cannot_vote(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();
        $outsider = User::factory()->create();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
        ]);

        $approval = ApprovalRequest::first();

        $response = $this->actingAs($outsider)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);

        $response->assertForbidden();
    }

    public function test_cannot_vote_twice(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'approver2' => $approver2, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id, $approver2->id],
        ]);

        $approval = ApprovalRequest::first();

        // První hlas
        $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);

        // Druhý hlas — forbidden (už hlasoval, policy blokne)
        $response = $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'rejected',
        ]);

        $response->assertForbidden();
    }

    public function test_requester_can_cancel(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
        ]);

        $approval = ApprovalRequest::first();

        $response = $this->actingAs($requester)->post("/projects/{$project->id}/approvals/{$approval->id}/cancel");

        $response->assertRedirect();
        $this->assertEquals(ApprovalStatus::Cancelled, $approval->fresh()->status);
    }

    public function test_non_requester_cannot_cancel(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();
        $other = User::factory()->create();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
        ]);

        $approval = ApprovalRequest::first();

        $response = $this->actingAs($other)->post("/projects/{$project->id}/approvals/{$approval->id}/cancel");

        $response->assertForbidden();
    }

    public function test_vote_is_audited(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
        ]);

        $approval = ApprovalRequest::first();

        $this->actingAs($approver1)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);

        $entry = AuditEntry::where('entity_type', ApprovalRequest::class)
            ->where('entity_id', $approval->id)
            ->where('action', AuditAction::ApprovalApproved->value)
            ->first();

        $this->assertNotNull($entry);
    }

    public function test_member_can_view_approval_list(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        $response = $this->actingAs($user)->get("/projects/{$project->id}/approvals");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Approvals/Index'));
    }

    public function test_approver_can_view_approval_detail(): void
    {
        ['requester' => $requester, 'approver1' => $approver1, 'project' => $project, 'task' => $task] = $this->createApprovalSetup();

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver1->id],
        ]);

        $approval = ApprovalRequest::first();

        $response = $this->actingAs($approver1)->get("/projects/{$project->id}/approvals/{$approval->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Approvals/Show'));
    }
}
