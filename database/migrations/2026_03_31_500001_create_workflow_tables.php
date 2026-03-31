<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('color')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_initial')->default(false);
            $table->boolean('is_done')->default(false);
            $table->boolean('is_cancelled')->default(false);
            $table->boolean('allow_transition_from_any')->default(false);
            $table->timestamps();

            $table->unique(['project_id', 'slug']);
            $table->index(['project_id', 'position']);
        });

        Schema::create('workflow_transitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('from_status_id')->constrained('workflow_statuses')->cascadeOnDelete();
            $table->foreignUuid('to_status_id')->constrained('workflow_statuses')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['from_status_id', 'to_status_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_transitions');
        Schema::dropIfExists('workflow_statuses');
    }
};
