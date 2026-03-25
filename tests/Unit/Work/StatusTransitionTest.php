<?php

declare(strict_types=1);

namespace Tests\Unit\Work;

use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Enums\TaskStatus;
use PHPUnit\Framework\TestCase;

class StatusTransitionTest extends TestCase
{
    public function test_task_backlog_allowed_transitions(): void
    {
        $status = TaskStatus::Backlog;

        $this->assertTrue($status->canTransitionTo(TaskStatus::Todo));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Cancelled));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Done));
        $this->assertFalse($status->canTransitionTo(TaskStatus::InProgress));
        $this->assertFalse($status->canTransitionTo(TaskStatus::InReview));
    }

    public function test_task_todo_allowed_transitions(): void
    {
        $status = TaskStatus::Todo;

        $this->assertTrue($status->canTransitionTo(TaskStatus::InProgress));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Backlog));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Cancelled));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Done));
    }

    public function test_task_in_progress_allowed_transitions(): void
    {
        $status = TaskStatus::InProgress;

        $this->assertTrue($status->canTransitionTo(TaskStatus::InReview));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Todo));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Cancelled));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Done));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Backlog));
    }

    public function test_task_in_review_allowed_transitions(): void
    {
        $status = TaskStatus::InReview;

        $this->assertTrue($status->canTransitionTo(TaskStatus::Done));
        $this->assertTrue($status->canTransitionTo(TaskStatus::InProgress));
        $this->assertTrue($status->canTransitionTo(TaskStatus::Cancelled));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Backlog));
    }

    public function test_task_done_can_only_reopen(): void
    {
        $status = TaskStatus::Done;

        $this->assertTrue($status->canTransitionTo(TaskStatus::InProgress));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Backlog));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Cancelled));
    }

    public function test_task_cancelled_can_only_reopen_to_backlog(): void
    {
        $status = TaskStatus::Cancelled;

        $this->assertTrue($status->canTransitionTo(TaskStatus::Backlog));
        $this->assertFalse($status->canTransitionTo(TaskStatus::InProgress));
        $this->assertFalse($status->canTransitionTo(TaskStatus::Done));
    }

    public function test_task_board_columns_excludes_cancelled(): void
    {
        $columns = TaskStatus::boardColumns();

        $this->assertContains(TaskStatus::Backlog, $columns);
        $this->assertContains(TaskStatus::Done, $columns);
        $this->assertNotContains(TaskStatus::Cancelled, $columns);
    }

    public function test_epic_backlog_allowed_transitions(): void
    {
        $status = EpicStatus::Backlog;

        $this->assertTrue($status->canTransitionTo(EpicStatus::InProgress));
        $this->assertTrue($status->canTransitionTo(EpicStatus::Cancelled));
        $this->assertFalse($status->canTransitionTo(EpicStatus::Done));
    }

    public function test_epic_in_progress_allowed_transitions(): void
    {
        $status = EpicStatus::InProgress;

        $this->assertTrue($status->canTransitionTo(EpicStatus::Done));
        $this->assertTrue($status->canTransitionTo(EpicStatus::Backlog));
        $this->assertTrue($status->canTransitionTo(EpicStatus::Cancelled));
    }

    public function test_epic_done_can_only_reopen(): void
    {
        $status = EpicStatus::Done;

        $this->assertTrue($status->canTransitionTo(EpicStatus::InProgress));
        $this->assertFalse($status->canTransitionTo(EpicStatus::Backlog));
    }

    public function test_epic_cancelled_can_only_reopen_to_backlog(): void
    {
        $status = EpicStatus::Cancelled;

        $this->assertTrue($status->canTransitionTo(EpicStatus::Backlog));
        $this->assertFalse($status->canTransitionTo(EpicStatus::InProgress));
    }
}
