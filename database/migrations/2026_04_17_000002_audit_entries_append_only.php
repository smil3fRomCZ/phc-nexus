<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Finding H3 z audit reportu 2026-04-17: tabulka `audit_entries` sice
     * na úrovni Eloquent modelu má `UPDATED_AT = null`, ale app user má
     * v Postgres plné UPDATE/DELETE privileje — jakýkoli kód (budoucí cascade
     * delete, admin s psql, kompromitovaný service account) může záznamy
     * přepsat či smazat.
     *
     * Postgres RULE definuje "ON UPDATE/DELETE DO INSTEAD NOTHING" → UPDATE
     * i DELETE SQL projde syntakticky, ale nezmění žádný řádek. Kombinace
     * s existujícím INSERT-only kódem v AuditService znamená, že tabulka
     * je reálně write-once na DB úrovni. DROP TABLE (migration down) stále
     * projde — rules jsou drop-ed spolu s tabulkou.
     *
     * SQLite (default test driver) nepodporuje CREATE RULE; na něm
     * migraci přeskočíme a spoléháme se na application-level enforcement.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE RULE audit_entries_no_update AS ON UPDATE TO audit_entries DO INSTEAD NOTHING');
        DB::statement('CREATE RULE audit_entries_no_delete AS ON DELETE TO audit_entries DO INSTEAD NOTHING');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP RULE IF EXISTS audit_entries_no_update ON audit_entries');
        DB::statement('DROP RULE IF EXISTS audit_entries_no_delete ON audit_entries');
    }
};
