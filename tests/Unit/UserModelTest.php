<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use PHPUnit\Framework\TestCase;

class UserModelTest extends TestCase
{
    public function test_is_executive(): void
    {
        $user = new User;
        $user->system_role = SystemRole::Executive;
        $this->assertTrue($user->isExecutive());
    }

    public function test_non_executive_returns_false(): void
    {
        $user = new User;
        $user->system_role = SystemRole::TeamMember;
        $this->assertFalse($user->isExecutive());
    }

    public function test_is_project_manager(): void
    {
        $user = new User;
        $user->system_role = SystemRole::ProjectManager;
        $this->assertTrue($user->isProjectManager());
    }

    public function test_non_pm_returns_false(): void
    {
        $user = new User;
        $user->system_role = SystemRole::Reader;
        $this->assertFalse($user->isProjectManager());
    }

    public function test_is_active(): void
    {
        $user = new User;
        $user->status = UserStatus::Active;
        $this->assertTrue($user->isActive());
    }

    public function test_deactivated_is_not_active(): void
    {
        $user = new User;
        $user->status = UserStatus::Deactivated;
        $this->assertFalse($user->isActive());
    }
}
