<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalMode;
use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Work\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApprovalRequest>
 */
class ApprovalRequestFactory extends Factory
{
    protected $model = ApprovalRequest::class;

    public function definition(): array
    {
        return [
            'approvable_type' => Task::class,
            'approvable_id' => Task::factory(),
            'requester_id' => User::factory(),
            'status' => ApprovalStatus::Pending,
            'mode' => ApprovalMode::AllApprove,
            'description' => fake()->optional()->sentence(),
            'expires_at' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => ApprovalStatus::Approved,
            'decided_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => ApprovalStatus::Rejected,
            'decided_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
