<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->string('category', 50)->default('custom');
            $table->foreignUuid('author_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedSmallInteger('version')->default(1);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('workflow_template_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_id')->constrained('workflow_templates')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('color', 20)->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->boolean('is_initial')->default(false);
            $table->boolean('is_done')->default(false);
            $table->boolean('is_cancelled')->default(false);
            $table->boolean('allow_transition_from_any')->default(false);
            $table->timestamps();

            $table->unique(['template_id', 'slug']);
        });

        Schema::create('workflow_template_transitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_id')->constrained('workflow_templates')->cascadeOnDelete();
            $table->foreignUuid('from_status_id')->constrained('workflow_template_statuses')->cascadeOnDelete();
            $table->foreignUuid('to_status_id')->constrained('workflow_template_statuses')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['from_status_id', 'to_status_id']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->foreignUuid('workflow_template_id')->nullable()->after('project_type')
                ->constrained('workflow_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workflow_template_id');
        });
        Schema::dropIfExists('workflow_template_transitions');
        Schema::dropIfExists('workflow_template_statuses');
        Schema::dropIfExists('workflow_templates');
    }
};
