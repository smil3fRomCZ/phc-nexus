<?php

declare(strict_types=1);

namespace Tests\Unit\Organization;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Policies\DivisionPolicy;
use PHPUnit\Framework\TestCase;

class DivisionPolicyTest extends TestCase
{
    private DivisionPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new DivisionPolicy;
    }

    private function makeUser(SystemRole $role): User
    {
        $user = new User;
        $user->id = fake()->uuid();
        $user->system_role = $role;

        return $user;
    }

    public function test_anyone_can_view_any(): void
    {
        $this->assertTrue($this->policy->viewAny($this->makeUser(SystemRole::Reader)));
    }

    public function test_executive_can_create(): void
    {
        $this->assertTrue($this->policy->create($this->makeUser(SystemRole::Executive)));
    }

    public function test_pm_cannot_create(): void
    {
        $this->assertFalse($this->policy->create($this->makeUser(SystemRole::ProjectManager)));
    }

    public function test_executive_can_update(): void
    {
        $this->assertTrue($this->policy->update($this->makeUser(SystemRole::Executive), new Division));
    }

    public function test_team_member_cannot_update(): void
    {
        $this->assertFalse($this->policy->update($this->makeUser(SystemRole::TeamMember), new Division));
    }

    public function test_executive_can_delete(): void
    {
        $this->assertTrue($this->policy->delete($this->makeUser(SystemRole::Executive), new Division));
    }
}
