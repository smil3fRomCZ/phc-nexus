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
        // Add nullable number columns first
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedInteger('number')->nullable()->after('project_id');
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->unsignedInteger('number')->nullable()->after('project_id');
        });

        // Backfill existing tasks — number per project, ordered by created_at
        DB::statement('
            UPDATE tasks SET number = sub.row_num
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) AS row_num
                FROM tasks
            ) sub
            WHERE tasks.id = sub.id
        ');

        // Backfill existing epics
        DB::statement('
            UPDATE epics SET number = sub.row_num
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) AS row_num
                FROM epics
            ) sub
            WHERE epics.id = sub.id
        ');

        // Make NOT NULL + add unique compound index
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedInteger('number')->nullable(false)->change();
            $table->unique(['project_id', 'number']);
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->unsignedInteger('number')->nullable(false)->change();
            $table->unique(['project_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropUnique(['project_id', 'number']);
            $table->dropColumn('number');
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->dropUnique(['project_id', 'number']);
            $table->dropColumn('number');
        });
    }
};
