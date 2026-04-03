<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuditTrailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('auditable_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('status')->default('draft');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('auditable_items');
        parent::tearDown();
    }

    // --- AuditService ---

    public function test_audit_service_creates_entry(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AuditableItem::create(['title' => 'Test']);

        $service = new AuditService;
        $entry = $service->log(AuditAction::Viewed, $item);

        $this->assertEquals(AuditAction::Viewed, $entry->action);
        $this->assertEquals($item->getMorphClass(), $entry->entity_type);
        $this->assertEquals($item->id, $entry->entity_id);
        $this->assertEquals($user->id, $entry->actor_id);
    }

    public function test_audit_service_stores_payload(): void
    {
        $item = AuditableItem::create(['title' => 'Test']);

        $service = new AuditService;
        $entry = $service->log(
            AuditAction::StatusChanged,
            $item,
            payload: ['from' => 'draft', 'to' => 'active'],
        );

        $this->assertEquals(['from' => 'draft', 'to' => 'active'], $entry->payload);
    }

    // --- Auditable trait: auto-logging ---

    public function test_create_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AuditableItem::create(['title' => 'New item']);

        $entry = AuditEntry::where('entity_id', $item->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('New item', $entry->new_values['title']);
        $this->assertEquals($user->id, $entry->actor_id);
    }

    public function test_update_is_audited_with_old_and_new_values(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AuditableItem::create(['title' => 'Original']);
        $item->update(['title' => 'Updated']);

        $entry = AuditEntry::where('entity_id', $item->id)
            ->where('action', AuditAction::Updated->value)
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('Original', $entry->old_values['title']);
        $this->assertEquals('Updated', $entry->new_values['title']);
    }

    public function test_update_without_changes_is_not_audited(): void
    {
        $item = AuditableItem::create(['title' => 'Same']);
        $item->update(['title' => 'Same']);

        $count = AuditEntry::where('entity_id', $item->id)
            ->where('action', AuditAction::Updated->value)
            ->count();

        $this->assertEquals(0, $count);
    }

    public function test_delete_is_audited(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $item = AuditableItem::create(['title' => 'To delete']);
        $itemId = $item->id;
        $item->delete();

        $entry = AuditEntry::where('entity_id', $itemId)
            ->where('action', AuditAction::Deleted->value)
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals($user->id, $entry->actor_id);
    }

    public function test_excluded_fields_are_not_tracked(): void
    {
        $item = AuditableItem::create(['title' => 'Test']);

        $entry = AuditEntry::where('entity_id', $item->id)
            ->where('action', AuditAction::Created->value)
            ->first();

        $this->assertArrayNotHasKey('created_at', $entry->new_values);
        $this->assertArrayNotHasKey('updated_at', $entry->new_values);
    }

    public function test_audit_entries_relationship(): void
    {
        $item = AuditableItem::create(['title' => 'Test']);
        $item->update(['title' => 'Changed']);

        $this->assertCount(2, $item->auditEntries);
    }

    // --- AuditEntry model ---

    public function test_audit_entry_is_immutable_concept(): void
    {
        $item = AuditableItem::create(['title' => 'Test']);
        $entry = AuditEntry::first();

        $this->assertNotNull($entry);
        $this->assertNull($entry->updated_at);
    }

    public function test_audit_entry_actor_relationship(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        AuditableItem::create(['title' => 'Test']);

        $entry = AuditEntry::first();
        $this->assertEquals($user->id, $entry->actor->id);
    }

    // ── Date Range Filter ──

    public function test_audit_log_can_filter_by_date_from(): void
    {
        $exec = User::factory()->executive()->create();

        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::LoggedIn,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now()->subDays(5),
        ]);
        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::LoggedIn,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now()->subDays(1),
        ]);

        $dateFrom = now()->subDays(3)->format('Y-m-d');
        $response = $this->actingAs($exec)->get("/admin/audit-log?date_from={$dateFrom}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('entries.data', 1));
    }

    public function test_audit_log_can_filter_by_date_to(): void
    {
        $exec = User::factory()->executive()->create();

        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::Created,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now()->subDays(5),
        ]);
        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::Created,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now(),
        ]);

        $dateTo = now()->subDays(3)->format('Y-m-d');
        $response = $this->actingAs($exec)->get("/admin/audit-log?date_to={$dateTo}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('entries.data', 1));
    }

    public function test_audit_log_can_filter_by_date_range(): void
    {
        $exec = User::factory()->executive()->create();

        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::Updated,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now()->subDays(10),
        ]);
        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::Updated,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now()->subDays(5),
        ]);
        AuditEntry::forceCreate([
            'id' => \Illuminate\Support\Str::uuid7()->toString(),
            'action' => AuditAction::Updated,
            'entity_type' => User::class,
            'entity_id' => $exec->id,
            'actor_id' => $exec->id,
            'created_at' => now(),
        ]);

        $dateFrom = now()->subDays(7)->format('Y-m-d');
        $dateTo = now()->subDays(3)->format('Y-m-d');
        $response = $this->actingAs($exec)->get("/admin/audit-log?date_from={$dateFrom}&date_to={$dateTo}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->has('entries.data', 1));
    }
}

class AuditableItem extends Model
{
    use Auditable, HasUuidV7;

    protected $fillable = ['title', 'status'];
}
