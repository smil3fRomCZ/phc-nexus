<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('board_columns');
    }

    public function down(): void
    {
        // board_columns replaced by workflow_statuses — no rollback
    }
};
