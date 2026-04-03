<?php

declare(strict_types=1);

namespace Tests\Unit\Work;

use App\Modules\Work\Enums\EpicStatus;
use PHPUnit\Framework\TestCase;

class EpicStatusTest extends TestCase
{
    public function test_all_statuses_have_labels(): void
    {
        foreach (EpicStatus::cases() as $status) {
            $this->assertNotEmpty($status->label());
        }
    }

    public function test_has_four_cases(): void
    {
        $this->assertCount(4, EpicStatus::cases());
    }

    public function test_backlog_can_transition_to_in_progress(): void
    {
        $this->assertTrue(EpicStatus::Backlog->canTransitionTo(EpicStatus::InProgress));
    }

    public function test_done_cannot_transition_to_backlog(): void
    {
        $this->assertFalse(EpicStatus::Done->canTransitionTo(EpicStatus::Backlog));
    }

    public function test_all_statuses_have_allowed_transitions(): void
    {
        foreach (EpicStatus::cases() as $status) {
            $this->assertIsArray($status->allowedTransitions());
        }
    }
}
