<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migrace starších hodnot `role` na granulární model (admin/contributor/viewer).
     *
     * Mapování:
     * - 'project_manager' → 'admin'
     * - 'member'          → 'contributor'
     * - 'admin'           → ponechat (pro případ opakovaného spuštění)
     * - 'contributor'     → ponechat
     * - 'viewer'          → ponechat
     * - jakékoli jiné     → 'contributor' (bezpečný default)
     */
    public function up(): void
    {
        DB::table('project_members')
            ->where('role', 'project_manager')
            ->update(['role' => 'admin']);

        DB::table('project_members')
            ->where('role', 'member')
            ->update(['role' => 'contributor']);

        DB::table('project_members')
            ->whereNotIn('role', ['admin', 'contributor', 'viewer'])
            ->update(['role' => 'contributor']);
    }

    public function down(): void
    {
        // Reverzibilní: admin → project_manager, contributor → member.
        // Viewer neměl ekvivalent, bezpečně ho zmapujeme na member.
        DB::table('project_members')
            ->where('role', 'admin')
            ->update(['role' => 'project_manager']);

        DB::table('project_members')
            ->whereIn('role', ['contributor', 'viewer'])
            ->update(['role' => 'member']);
    }
};
