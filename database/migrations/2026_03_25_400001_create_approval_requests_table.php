<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('approvable_type');
            $table->uuid('approvable_id');
            $table->foreignUuid('requester_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->string('mode')->default('all_approve');
            $table->text('description')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['approvable_type', 'approvable_id']);
            $table->index('status');
        });

        Schema::create('approval_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('approval_request_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('voter_id')->constrained('users')->cascadeOnDelete();
            $table->string('decision')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('voted_at')->nullable();
            $table->timestamps();

            $table->unique(['approval_request_id', 'voter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_votes');
        Schema::dropIfExists('approval_requests');
    }
};
