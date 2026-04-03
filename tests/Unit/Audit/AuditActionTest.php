<?php

declare(strict_types=1);

namespace Tests\Unit\Audit;

use App\Modules\Audit\Enums\AuditAction;
use PHPUnit\Framework\TestCase;

class AuditActionTest extends TestCase
{
    public function test_all_actions_have_labels(): void
    {
        foreach (AuditAction::cases() as $action) {
            $this->assertNotEmpty($action->label());
        }
    }

    public function test_has_nineteen_cases(): void
    {
        $this->assertCount(19, AuditAction::cases());
    }

    public function test_label_formats_value_correctly(): void
    {
        $this->assertEquals('Logged in', AuditAction::LoggedIn->label());
        $this->assertEquals('Created', AuditAction::Created->label());
        $this->assertEquals('Phi accessed', AuditAction::PhiAccessed->label());
    }
}
