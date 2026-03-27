<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_dependencies', function (Blueprint $table) {
            $table->uuid('blocker_id');
            $table->uuid('blocked_id');
            $table->primary(['blocker_id', 'blocked_id']);
            $table->foreign('blocker_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('blocked_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_dependencies');
    }
};
