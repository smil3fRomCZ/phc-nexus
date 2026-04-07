<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estimation_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('scale_type', 20)->default('fibonacci'); // fibonacci | tshirt
            $table->string('status', 20)->default('active'); // active | completed
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('estimation_rounds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('estimation_sessions')->cascadeOnDelete();
            $table->foreignUuid('task_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('round_number')->default(1);
            $table->unsignedTinyInteger('final_value')->nullable();
            $table->string('status', 20)->default('voting'); // voting | revealed | confirmed
            $table->timestamps();

            $table->unique(['session_id', 'task_id', 'round_number']);
        });

        Schema::create('estimation_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('round_id')->constrained('estimation_rounds')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('value')->nullable();
            $table->timestamps();

            $table->unique(['round_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estimation_votes');
        Schema::dropIfExists('estimation_rounds');
        Schema::dropIfExists('estimation_sessions');
    }
};
