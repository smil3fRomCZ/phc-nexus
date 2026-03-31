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
            $table->uuid('parent_id')->nullable();
            $table->string('title');
            $table->text('content')->default('');
            $table->foreignUuid('author_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'parent_id', 'position']);
            $table->foreign('parent_id')->references('id')->on('wiki_pages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wiki_pages');
    }
};
