<?php

declare(strict_types=1);

namespace Tests\Unit\Approvals;

use App\Modules\Approvals\Enums\ApprovalStatus;
use PHPUnit\Framework\TestCase;

class ApprovalStatusTest extends TestCase
{
    public function test_all_statuses_have_labels(): void
    {
        foreach (ApprovalStatus::cases() as $status) {
            $this->assertNotEmpty($status->label());
        }
    }

    public function test_has_four_cases(): void
    {
        $this->assertCount(4, ApprovalStatus::cases());
    }

    public function test_pending_is_not_resolved(): void
    {
        $this->assertFalse(ApprovalStatus::Pending->isResolved());
    }

    public function test_approved_is_resolved(): void
    {
        $this->assertTrue(ApprovalStatus::Approved->isResolved());
    }

    public function test_rejected_is_resolved(): void
    {
        $this->assertTrue(ApprovalStatus::Rejected->isResolved());
    }

    public function test_cancelled_is_resolved(): void
    {
        $this->assertTrue(ApprovalStatus::Cancelled->isResolved());
    }
}
