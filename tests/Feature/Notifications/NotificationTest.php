<?php

declare(strict_types=1);

namespace Tests\Feature\Notifications;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Notifications\Notifications\ApprovalRequestedNotification;
use App\Modules\Notifications\Notifications\ApprovalVoteCastNotification;
use App\Modules\Notifications\Notifications\TaskAssignedNotification;
use App\Modules\Notifications\Notifications\TaskStatusChangedNotification;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_approval_request_sends_notification_to_approvers(): void
    {
        Notification::fake();

        $requester = User::factory()->create();
        $approver = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $requester->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver->id],
            'description' => 'Prosím o schválení',
        ]);

        Notification::assertSentTo($approver, ApprovalRequestedNotification::class);
        Notification::assertNotSentTo($requester, ApprovalRequestedNotification::class);
    }

    public function test_vote_sends_notification_to_requester(): void
    {
        Notification::fake();

        $requester = User::factory()->create();
        $approver = User::factory()->create();
        $project = Project::factory()->create(['owner_id' => $requester->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        // Vytvoř request (faked, takže notification neprojde dál)
        $this->actingAs($requester)->post("/projects/{$project->id}/approvals", [
            'task_id' => $task->id,
            'approver_ids' => [$approver->id],
        ]);

        $approval = ApprovalRequest::first();

        // Vote
        $this->actingAs($approver)->post("/projects/{$project->id}/approvals/{$approval->id}/vote", [
            'decision' => 'approved',
        ]);

        Notification::assertSentTo($requester, ApprovalVoteCastNotification::class);
    }

    public function test_notification_index_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/notifications');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Notifications/Index')
            ->has('notifications')
            ->has('unreadCount')
        );
    }

    public function test_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create();

        // Ručně vytvořit DB notifikaci
        $user->notify(new TaskAssignedNotification($task, User::factory()->create()));

        $notification = $user->notifications()->first();
        $this->assertNull($notification->read_at);

        $response = $this->actingAs($user)->patchJson("/notifications/{$notification->id}/read");

        $response->assertOk();
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_as_read(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create();
        $assigner = User::factory()->create();

        $user->notify(new TaskAssignedNotification($task, $assigner));
        $user->notify(new TaskStatusChangedNotification($task, TaskStatus::Backlog, TaskStatus::Todo));

        $this->assertEquals(2, $user->unreadNotifications()->count());

        $response = $this->actingAs($user)->postJson('/notifications/read-all');

        $response->assertOk();
        $this->assertEquals(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_unread_count_endpoint(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create();

        $user->notify(new TaskAssignedNotification($task, User::factory()->create()));

        $response = $this->actingAs($user)->getJson('/notifications/unread-count');

        $response->assertOk();
        $response->assertJson(['count' => 1]);
    }

    public function test_task_assigned_notification_has_correct_data(): void
    {
        $user = User::factory()->create();
        $assigner = User::factory()->create();
        $task = Task::factory()->create(['title' => 'Test úkol']);

        $user->notify(new TaskAssignedNotification($task, $assigner));

        $notification = $user->notifications()->first();
        $this->assertEquals('task_assigned', $notification->data['type']);
        $this->assertStringContainsString('Test úkol', $notification->data['body']);
    }

    public function test_task_status_changed_notification_has_correct_data(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->create(['title' => 'Status test']);

        $user->notify(new TaskStatusChangedNotification($task, TaskStatus::Backlog, TaskStatus::Todo));

        $notification = $user->notifications()->first();
        $this->assertEquals('task_status_changed', $notification->data['type']);
        $this->assertEquals('backlog', $notification->data['old_status']);
        $this->assertEquals('todo', $notification->data['new_status']);
    }

    public function test_unauthenticated_user_cannot_access_notifications(): void
    {
        $this->get('/notifications')->assertRedirect('/login');
    }
}
