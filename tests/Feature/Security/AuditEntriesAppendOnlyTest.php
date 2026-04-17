<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Regression test pro finding H3 z audit reportu 2026-04-17:
 * tabulka `audit_entries` musí být append-only i na úrovni Postgres
 * (RULE ON UPDATE/DELETE DO INSTEAD NOTHING). Testuje jen na pgsql —
 * SQLite CREATE RULE nepodporuje, feature je inherently PG-specific.
 */
final class AuditEntriesAppendOnlyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Postgres-only feature — spusť v phpunit.pgsql.xml.');
        }
    }

    public function test_update_on_audit_entry_is_silently_ignored(): void
    {
        $entry = $this->logSomething();
        $originalAction = $entry->action;

        DB::table('audit_entries')
            ->where('id', $entry->id)
            ->update(['action' => AuditAction::Deleted->value]);

        $this->assertEquals(
            $originalAction,
            AuditEntry::find($entry->id)->action,
            'UPDATE musí být DB-level blokovaný; záznam zůstává beze změny.',
        );
    }

    public function test_delete_on_audit_entry_is_silently_ignored(): void
    {
        $entry = $this->logSomething();

        DB::table('audit_entries')->where('id', $entry->id)->delete();

        $this->assertTrue(
            AuditEntry::whereKey($entry->id)->exists(),
            'DELETE musí být DB-level blokovaný; záznam stále existuje.',
        );
    }

    public function test_insert_still_works(): void
    {
        $entry = $this->logSomething();

        $this->assertNotNull(AuditEntry::find($entry->id));
    }

    private function logSomething(): AuditEntry
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        app(AuditService::class)->log(AuditAction::Created, $user, ['reason' => 'test']);

        $entry = AuditEntry::where('entity_id', $user->id)->first();
        $this->assertNotNull($entry);

        return $entry;
    }
}
