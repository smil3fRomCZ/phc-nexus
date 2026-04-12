<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Změnit default z 'unknown' na 'non_phi' — většina úkolů neobsahuje PHI.
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('data_classification')->default('non_phi')->change();
        });

        // Existující 'unknown' záznamy překlasifikovat na 'non_phi'.
        DB::table('tasks')
            ->where('data_classification', 'unknown')
            ->update(['data_classification' => 'non_phi']);
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('data_classification')->default('unknown')->change();
        });
    }
};
