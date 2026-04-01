<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    // ── Update Role ──

    public function test_executive_can_update_user_role(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$target->id}/role", [
            'system_role' => 'project_manager',
        ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertEquals(SystemRole::ProjectManager, $target->fresh()->system_role);
    }

    public function test_executive_cannot_update_own_role(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$exec->id}/role", [
            'system_role' => 'team_member',
        ]);

        $response->assertForbidden();
    }

    public function test_pm_cannot_update_user_role(): void
    {
        $pm = User::factory()->projectManager()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($pm)->patch("/admin/users/{$target->id}/role", [
            'system_role' => 'reader',
        ]);

        $response->assertForbidden();
    }

    public function test_invalid_role_is_rejected(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->patch("/admin/users/{$target->id}/role", [
            'system_role' => 'superadmin',
        ]);

        $response->assertSessionHasErrors('system_role');
    }

    // ── Deactivate ──

    public function test_executive_can_deactivate_user(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($exec)->post("/admin/users/{$target->id}/deactivate");

        $response->assertRedirect(route('admin.users.index'));
        $this->assertEquals(UserStatus::Deactivated, $target->fresh()->status);
    }

    public function test_executive_cannot_deactivate_self(): void
    {
        $exec = User::factory()->executive()->create();

        $response = $this->actingAs($exec)->post("/admin/users/{$exec->id}/deactivate");

        $response->assertForbidden();
    }

    public function test_pm_cannot_deactivate_user(): void
    {
        $pm = User::factory()->projectManager()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($pm)->post("/admin/users/{$target->id}/deactivate");

        $response->assertForbidden();
    }

    // ── Activate ──

    public function test_executive_can_activate_deactivated_user(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->deactivated()->create();

        $response = $this->actingAs($exec)->post("/admin/users/{$target->id}/activate");

        $response->assertRedirect(route('admin.users.index'));
        $this->assertEquals(UserStatus::Active, $target->fresh()->status);
    }

    // ── User list ──

    public function test_user_list_shows_all_users_for_executive(): void
    {
        $exec = User::factory()->executive()->create();
        User::factory()->count(3)->create();

        $response = $this->actingAs($exec)->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Users/Index')
            ->has('users', 4) // 3 + executive
            ->has('roles')
            ->has('statuses')
        );
    }

    public function test_member_cannot_view_user_list(): void
    {
        $member = User::factory()->create();

        $response = $this->actingAs($member)->get('/admin/users');

        $response->assertForbidden();
    }

    public function test_user_list_supports_search_filter(): void
    {
        $exec = User::factory()->executive()->create();
        User::factory()->create(['name' => 'Jana Nováková']);
        User::factory()->create(['name' => 'Petr Svoboda']);

        $response = $this->actingAs($exec)->get('/admin/users?search=Jana');

        $response->assertInertia(fn ($page) => $page->has('users', 1));
    }

    public function test_user_list_supports_role_filter(): void
    {
        $exec = User::factory()->executive()->create();
        User::factory()->projectManager()->create();
        User::factory()->create();

        $response = $this->actingAs($exec)->get('/admin/users?role=project_manager');

        $response->assertInertia(fn ($page) => $page->has('users', 1));
    }
}
