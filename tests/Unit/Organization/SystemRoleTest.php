<?php

declare(strict_types=1);

namespace Tests\Unit\Organization;

use App\Modules\Organization\Enums\SystemRole;
use PHPUnit\Framework\TestCase;

class SystemRoleTest extends TestCase
{
    public function test_all_roles_have_labels(): void
    {
        foreach (SystemRole::cases() as $role) {
            $this->assertNotEmpty($role->label());
        }
    }

    public function test_has_five_cases(): void
    {
        $this->assertCount(5, SystemRole::cases());
    }

    public function test_values_are_snake_case(): void
    {
        foreach (SystemRole::cases() as $role) {
            $this->assertMatchesRegularExpression('/^[a-z_]+$/', $role->value);
        }
    }
}
