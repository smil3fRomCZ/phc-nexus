<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('benefit_type')->nullable()->after('target_date');
            $table->decimal('benefit_amount', 15, 2)->nullable()->after('benefit_type');
            $table->text('benefit_note')->nullable()->after('benefit_amount');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('benefit_type')->nullable()->after('due_date');
            $table->decimal('benefit_amount', 15, 2)->nullable()->after('benefit_type');
            $table->text('benefit_note')->nullable()->after('benefit_amount');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['benefit_type', 'benefit_amount', 'benefit_note']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['benefit_type', 'benefit_amount', 'benefit_note']);
        });
    }
};
