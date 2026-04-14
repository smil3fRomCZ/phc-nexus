<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_executive_can_view_audit_log(): void
    {
        $admin = User::factory()->executive()->create();

        $response = $this->actingAs($admin)->get('/admin/audit-log');

        $response->assertStatus(200);
    }

    public function test_project_manager_cannot_view_audit_log(): void
    {
        $pm = User::factory()->projectManager()->create();

        $response = $this->actingAs($pm)->get('/admin/audit-log');

        $response->assertForbidden();
    }

    public function test_team_member_cannot_view_audit_log(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->get('/admin/audit-log');

        $response->assertForbidden();
    }

    public function test_guest_redirected_to_login(): void
    {
        $response = $this->get('/admin/audit-log');

        $response->assertRedirect('/login');
    }
}
