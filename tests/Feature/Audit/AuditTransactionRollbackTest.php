<?php

declare(strict_types=1);

namespace Tests\Feature\Audit;

use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Projects\Models\Project;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditTransactionRollbackTest extends TestCase
{
    use DatabaseMigrations;

    public function test_audit_entry_not_written_when_transaction_rolls_back(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);
        $project = Project::factory()->create();

        $before = AuditEntry::count();

        try {
            DB::transaction(function () use ($project) {
                app(AuditService::class)->log(
                    action: AuditAction::Updated,
                    entity: $project,
                    newValues: ['name' => 'should-not-persist'],
                );

                throw new \RuntimeException('rollback');
            });
        } catch (\RuntimeException) {
            // očekáváno
        }

        $this->assertSame($before, AuditEntry::count());
    }

    public function test_audit_entry_written_after_transaction_commits(): void
    {
        $actor = User::factory()->create();
        $this->actingAs($actor);
        $project = Project::factory()->create();

        $before = AuditEntry::count();

        DB::transaction(function () use ($project) {
            app(AuditService::class)->log(
                action: AuditAction::Updated,
                entity: $project,
                newValues: ['name' => 'persists'],
            );
        });

        $this->assertSame($before + 1, AuditEntry::count());
    }
}
