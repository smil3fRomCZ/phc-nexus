<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignUuid('workflow_status_id')->nullable()->after('status')
                ->constrained('workflow_statuses')->nullOnDelete();
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->foreignUuid('workflow_status_id')->nullable()->after('status')
                ->constrained('workflow_statuses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workflow_status_id');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workflow_status_id');
        });
    }
};
