<?php

declare(strict_types=1);

namespace Tests\Unit\Organization;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Policies\UserPolicy;
use PHPUnit\Framework\TestCase;

class UserPolicyTest extends TestCase
{
    private UserPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new UserPolicy();
    }

    private function makeUser(SystemRole $role, ?string $id = null): User
    {
        $user = new User();
        $user->id = $id ?? fake()->uuid();
        $user->system_role = $role;

        return $user;
    }

    public function test_executive_can_view_any(): void
    {
        $this->assertTrue($this->policy->viewAny($this->makeUser(SystemRole::Executive)));
    }

    public function test_pm_can_view_any(): void
    {
        $this->assertTrue($this->policy->viewAny($this->makeUser(SystemRole::ProjectManager)));
    }

    public function test_team_member_cannot_view_any(): void
    {
        $this->assertFalse($this->policy->viewAny($this->makeUser(SystemRole::TeamMember)));
    }

    public function test_reader_cannot_view_any(): void
    {
        $this->assertFalse($this->policy->viewAny($this->makeUser(SystemRole::Reader)));
    }

    public function test_user_can_view_self(): void
    {
        $user = $this->makeUser(SystemRole::TeamMember, 'same-id');
        $target = $this->makeUser(SystemRole::TeamMember, 'same-id');
        $this->assertTrue($this->policy->view($user, $target));
    }

    public function test_executive_can_view_other(): void
    {
        $exec = $this->makeUser(SystemRole::Executive);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertTrue($this->policy->view($exec, $target));
    }

    public function test_team_member_cannot_view_other(): void
    {
        $member = $this->makeUser(SystemRole::TeamMember);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertFalse($this->policy->view($member, $target));
    }

    public function test_executive_can_update_user(): void
    {
        $exec = $this->makeUser(SystemRole::Executive);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertTrue($this->policy->updateUser($exec, $target));
    }

    public function test_pm_cannot_update_user(): void
    {
        $pm = $this->makeUser(SystemRole::ProjectManager);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertFalse($this->policy->updateUser($pm, $target));
    }

    public function test_executive_can_update_role_of_other(): void
    {
        $exec = $this->makeUser(SystemRole::Executive);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertTrue($this->policy->updateRole($exec, $target));
    }

    public function test_executive_cannot_update_own_role(): void
    {
        $exec = $this->makeUser(SystemRole::Executive, 'same-id');
        $target = $this->makeUser(SystemRole::Executive, 'same-id');
        $this->assertFalse($this->policy->updateRole($exec, $target));
    }

    public function test_executive_cannot_deactivate_self(): void
    {
        $exec = $this->makeUser(SystemRole::Executive, 'same-id');
        $target = $this->makeUser(SystemRole::Executive, 'same-id');
        $this->assertFalse($this->policy->deactivate($exec, $target));
    }

    public function test_executive_can_deactivate_other(): void
    {
        $exec = $this->makeUser(SystemRole::Executive);
        $target = $this->makeUser(SystemRole::TeamMember);
        $this->assertTrue($this->policy->deactivate($exec, $target));
    }
}
