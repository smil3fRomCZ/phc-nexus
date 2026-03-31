<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->integer('pos_x')->default(0)->after('position');
            $table->integer('pos_y')->default(0)->after('pos_x');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->dropColumn(['pos_x', 'pos_y']);
        });
    }
};
