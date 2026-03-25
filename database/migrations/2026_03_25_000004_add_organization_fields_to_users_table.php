<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('system_role')->default('team_member')->after('email');
            $table->string('status')->default('active')->after('system_role');
            $table->foreignUuid('team_id')->nullable()->after('status')->constrained()->nullOnDelete();
            $table->decimal('capacity_h_week', 5, 1)->nullable()->after('team_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
            $table->dropColumn(['system_role', 'status', 'capacity_h_week']);
        });
    }
};
