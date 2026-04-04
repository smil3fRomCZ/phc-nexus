<?php

declare(strict_types=1);

namespace Tests\Unit\Projects;

use App\Modules\Projects\Enums\ProjectStatus;
use PHPUnit\Framework\TestCase;

class ProjectStatusTest extends TestCase
{
    public function test_all_statuses_have_labels(): void
    {
        foreach (ProjectStatus::cases() as $status) {
            $this->assertNotEmpty($status->label());
        }
    }

    public function test_has_five_cases(): void
    {
        $this->assertCount(5, ProjectStatus::cases());
    }

    public function test_expected_statuses_exist(): void
    {
        $this->assertNotNull(ProjectStatus::Draft);
        $this->assertNotNull(ProjectStatus::Active);
        $this->assertNotNull(ProjectStatus::OnHold);
        $this->assertNotNull(ProjectStatus::Completed);
        $this->assertNotNull(ProjectStatus::Archived);
    }
}
