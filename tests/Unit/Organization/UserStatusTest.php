<?php

declare(strict_types=1);

namespace Tests\Unit\Organization;

use App\Modules\Organization\Enums\UserStatus;
use PHPUnit\Framework\TestCase;

class UserStatusTest extends TestCase
{
    public function test_all_statuses_have_labels(): void
    {
        foreach (UserStatus::cases() as $status) {
            $this->assertNotEmpty($status->label());
        }
    }

    public function test_has_three_cases(): void
    {
        $this->assertCount(3, UserStatus::cases());
    }

    public function test_active_invited_deactivated_exist(): void
    {
        $this->assertNotNull(UserStatus::Active);
        $this->assertNotNull(UserStatus::Invited);
        $this->assertNotNull(UserStatus::Deactivated);
    }
}
