<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wiki_pages', function (Blueprint $table) {
            $table->foreignUuid('epic_id')->nullable()->after('project_id')
                ->constrained('epics')->nullOnDelete();
            $table->index(['epic_id', 'parent_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::table('wiki_pages', function (Blueprint $table) {
            $table->dropForeign(['epic_id']);
            $table->dropIndex(['epic_id', 'parent_id', 'position']);
            $table->dropColumn('epic_id');
        });
    }
};
