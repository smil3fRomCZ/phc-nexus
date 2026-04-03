<?php

declare(strict_types=1);

namespace Tests\Unit\Work;

use App\Modules\Work\Enums\TaskPriority;
use PHPUnit\Framework\TestCase;

class TaskPriorityTest extends TestCase
{
    public function test_all_priorities_have_labels(): void
    {
        foreach (TaskPriority::cases() as $priority) {
            $this->assertNotEmpty($priority->label());
        }
    }

    public function test_has_four_cases(): void
    {
        $this->assertCount(4, TaskPriority::cases());
    }

    public function test_expected_priorities_exist(): void
    {
        $this->assertNotNull(TaskPriority::Low);
        $this->assertNotNull(TaskPriority::Medium);
        $this->assertNotNull(TaskPriority::High);
        $this->assertNotNull(TaskPriority::Urgent);
    }
}
