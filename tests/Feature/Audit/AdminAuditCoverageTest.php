<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Organization\Enums\UserStatus;
use App\Modules\Organization\Models\Division;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuditCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_deactivate_user_writes_audit_with_old_and_new_values(): void
    {
        $exec = User::factory()->executive()->create();
        $target = User::factory()->create(['status' => UserStatus::Active]);

        $this->actingAs($exec)->post("/admin/users/{$target->id}/deactivate")
            ->assertRedirect();

        $entry = AuditEntry::query()
            ->where('entity_type', User::class)
            ->where('entity_id', $target->id)
            ->where('action', AuditAction::Updated)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('admin_deactivate', $entry->payload['operation']);
        $this->assertEquals(['status' => UserStatus::Active->value], $entry->old_values);
        $this->assertEquals(['status' => UserStatus::Deactivated->value], $entry->new_values);
    }

    public function test_admin_create_division_writes_audit(): void
    {
        $exec = User::factory()->executive()->create();

        $this->actingAs($exec)->post('/admin/divisions', [
            'name' => 'Engineering',
            'description' => 'Eng division',
        ])->assertRedirect();

        $this->assertDatabaseHas('audit_entries', [
            'entity_type' => Division::class,
            'action' => AuditAction::Created->value,
        ]);
    }

    public function test_pm_cannot_filter_audit_by_other_actor(): void
    {
        $pm = User::factory()->projectManager()->create();
        $other = User::factory()->create();

        $this->actingAs($pm)->get("/admin/audit-log?actor_id={$other->id}")
            ->assertForbidden();
    }

    public function test_pm_sees_only_scoped_audit_entries(): void
    {
        $pm = User::factory()->projectManager()->create();
        $outsider = User::factory()->executive()->create();

        $ownedProject = Project::factory()->create(['owner_id' => $pm->id]);
        $foreignProject = Project::factory()->create(['owner_id' => $outsider->id]);

        AuditEntry::create([
            'action' => AuditAction::Updated,
            'entity_type' => Project::class,
            'entity_id' => $ownedProject->id,
            'actor_id' => $outsider->id,
        ]);
        AuditEntry::create([
            'action' => AuditAction::Updated,
            'entity_type' => Project::class,
            'entity_id' => $foreignProject->id,
            'actor_id' => $outsider->id,
        ]);

        $response = $this->actingAs($pm)->get('/admin/audit-log');
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('Admin/AuditLog/Index')
            ->where('entries.data', fn ($entries) => collect($entries)
                ->every(fn ($e) => $e['entity_id'] === $ownedProject->id))
        );
    }
}
