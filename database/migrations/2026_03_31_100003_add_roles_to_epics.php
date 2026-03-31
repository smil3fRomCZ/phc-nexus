<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            $table->foreignUuid('pm_id')->nullable()->after('owner_id')->constrained('users')->nullOnDelete();
            $table->foreignUuid('lead_developer_id')->nullable()->after('pm_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_developer_id');
            $table->dropConstrainedForeignId('pm_id');
        });
    }
};
