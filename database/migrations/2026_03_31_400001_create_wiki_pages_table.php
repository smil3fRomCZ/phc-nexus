<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wiki_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->uuid('parent_id')->nullable()->index();
            $table->string('title');
            $table->text('content')->default('');
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'parent_id', 'position']);
        });

        // Self-referencing FK must be added after table creation (PostgreSQL requirement)
        Schema::table('wiki_pages', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('wiki_pages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('wiki_pages', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
        });
        Schema::dropIfExists('wiki_pages');
    }
};
