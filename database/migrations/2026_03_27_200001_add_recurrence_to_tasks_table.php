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
            $table->string('recurrence_rule')->nullable()->after('due_date');
            $table->date('recurrence_next_at')->nullable()->after('recurrence_rule');
            $table->uuid('recurrence_source_id')->nullable()->after('recurrence_next_at');

            $table->index('recurrence_next_at');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['recurrence_next_at']);
            $table->dropColumn(['recurrence_rule', 'recurrence_next_at', 'recurrence_source_id']);
        });
    }
};
