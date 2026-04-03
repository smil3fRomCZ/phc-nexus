<?php

declare(strict_types=1);

namespace Tests\Unit\Organization;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Policies\TeamPolicy;
use PHPUnit\Framework\TestCase;

class TeamPolicyTest extends TestCase
{
    private TeamPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new TeamPolicy();
    }

    private function makeUser(SystemRole $role, ?string $id = null): User
    {
        $user = new User();
        $user->id = $id ?? fake()->uuid();
        $user->system_role = $role;

        return $user;
    }

    private function makeTeam(?string $leadId = null): Team
    {
        $team = new Team();
        $team->team_lead_id = $leadId;

        return $team;
    }

    public function test_anyone_can_view_any(): void
    {
        $this->assertTrue($this->policy->viewAny($this->makeUser(SystemRole::Reader)));
    }

    public function test_executive_can_create(): void
    {
        $this->assertTrue($this->policy->create($this->makeUser(SystemRole::Executive)));
    }

    public function test_pm_can_create(): void
    {
        $this->assertTrue($this->policy->create($this->makeUser(SystemRole::ProjectManager)));
    }

    public function test_team_member_cannot_create(): void
    {
        $this->assertFalse($this->policy->create($this->makeUser(SystemRole::TeamMember)));
    }

    public function test_executive_can_update_any_team(): void
    {
        $this->assertTrue($this->policy->update($this->makeUser(SystemRole::Executive), $this->makeTeam()));
    }

    public function test_team_lead_can_update_own_team(): void
    {
        $leadId = 'lead-id';
        $this->assertTrue($this->policy->update($this->makeUser(SystemRole::TeamMember, $leadId), $this->makeTeam($leadId)));
    }

    public function test_non_lead_member_cannot_update_team(): void
    {
        $this->assertFalse($this->policy->update($this->makeUser(SystemRole::TeamMember), $this->makeTeam('other-id')));
    }

    public function test_executive_can_delete(): void
    {
        $this->assertTrue($this->policy->delete($this->makeUser(SystemRole::Executive), $this->makeTeam()));
    }

    public function test_pm_cannot_delete(): void
    {
        $this->assertFalse($this->policy->delete($this->makeUser(SystemRole::ProjectManager), $this->makeTeam()));
    }

    public function test_team_lead_can_manage_members(): void
    {
        $leadId = 'lead-id';
        $this->assertTrue($this->policy->manageMembers($this->makeUser(SystemRole::TeamMember, $leadId), $this->makeTeam($leadId)));
    }

    public function test_non_lead_cannot_manage_members(): void
    {
        $this->assertFalse($this->policy->manageMembers($this->makeUser(SystemRole::TeamMember), $this->makeTeam('other-id')));
    }
}
