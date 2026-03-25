<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Modules\Approvals\Models\ApprovalRequest;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasApprovals
{
    public function approvalRequests(): MorphMany
    {
        return $this->morphMany(ApprovalRequest::class, 'approvable');
    }

    public function pendingApproval(): ?ApprovalRequest
    {
        return $this->approvalRequests()
            ->where('status', 'pending')
            ->latest()
            ->first();
    }
}
