<?php

declare(strict_types=1);

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PromoteUserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotes_existing_user_to_executive_and_writes_audit(): void
    {
        $user = User::factory()->create([
            'system_role' => SystemRole::TeamMember,
            'status' => UserStatus::Active,
        ]);

        $this->artisan('user:promote', [
            'email' => $user->email,
            '--role' => 'executive',
            '--reason' => 'Initial bootstrap',
        ])->assertSuccessful();

        $user->refresh();
        $this->assertEquals(SystemRole::Executive, $user->system_role);

        $entry = AuditEntry::where('entity_id', $user->id)
            ->where('action', AuditAction::Updated->value)
            ->latest()
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('cli', $entry->payload['source']);
        $this->assertEquals('Initial bootstrap', $entry->payload['reason']);
        $this->assertEquals('team_member', $entry->old_values['system_role']);
        $this->assertEquals('executive', $entry->new_values['system_role']);
    }

    public function test_dry_run_does_not_change_user_or_create_audit(): void
    {
        $user = User::factory()->create([
            'system_role' => SystemRole::TeamMember,
        ]);

        $this->artisan('user:promote', [
            'email' => $user->email,
            '--role' => 'executive',
            '--dry-run' => true,
        ])->assertSuccessful();

        $user->refresh();
        $this->assertEquals(SystemRole::TeamMember, $user->system_role);
        $this->assertDatabaseMissing('audit_entries', [
            'entity_id' => $user->id,
            'action' => AuditAction::Updated->value,
        ]);
    }

    public function test_fails_on_unknown_email(): void
    {
        $this->artisan('user:promote', [
            'email' => 'nobody@example.com',
            '--reason' => 'test',
        ])->assertFailed();
    }

    public function test_rejects_invalid_role(): void
    {
        $user = User::factory()->create();

        $exitCode = $this->artisan('user:promote', [
            'email' => $user->email,
            '--role' => 'superadmin',
            '--reason' => 'test',
        ])->run();

        $this->assertEquals(2, $exitCode); // Command::INVALID
    }

    public function test_rejects_missing_reason_when_not_dry_run(): void
    {
        $user = User::factory()->create();

        $exitCode = $this->artisan('user:promote', [
            'email' => $user->email,
            '--role' => 'executive',
        ])->run();

        $this->assertEquals(2, $exitCode);
        $this->assertEquals(SystemRole::TeamMember, $user->fresh()->system_role);
    }

    public function test_idempotent_when_already_has_desired_config(): void
    {
        $user = User::factory()->create([
            'system_role' => SystemRole::Executive,
            'status' => UserStatus::Active,
        ]);

        $this->artisan('user:promote', [
            'email' => $user->email,
            '--role' => 'executive',
            '--status' => 'active',
            '--reason' => 'noop',
        ])->assertSuccessful();

        $this->assertDatabaseMissing('audit_entries', [
            'entity_id' => $user->id,
            'action' => AuditAction::Updated->value,
        ]);
    }
}
