<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ukládáme SHA256 hash invitation tokenu místo plaintextu, aby DB dump
     * neleakoval všechny pending pozvánky (finding M10 z audit reportu
     * 2026-04-17). Plaintextový sloupec `token` zatím zachováváme pro
     * backward compat — drop v následujícím PR po rollout + grace period.
     */
    public function up(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->string('token_hash', 64)->nullable()->after('token');
        });

        $this->backfillTokenHashes();

        Schema::table('invitations', function (Blueprint $table) {
            $table->string('token_hash', 64)->nullable(false)->change();
            $table->unique('token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table) {
            $table->dropUnique(['token_hash']);
            $table->dropColumn('token_hash');
        });
    }

    private function backfillTokenHashes(): void
    {
        DB::table('invitations')
            ->whereNull('token_hash')
            ->orderBy('id')
            ->chunkById(500, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('invitations')
                        ->where('id', $row->id)
                        ->update(['token_hash' => hash('sha256', (string) $row->token)]);
                }
            });
    }
};
