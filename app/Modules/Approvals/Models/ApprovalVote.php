<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalDecision;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalVote extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'approval_request_id',
        'voter_id',
        'decision',
        'comment',
        'voted_at',
    ];

    protected function casts(): array
    {
        return [
            'decision' => ApprovalDecision::class,
            'voted_at' => 'datetime',
        ];
    }

    public function approvalRequest(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class);
    }

    public function voter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voter_id');
    }

    public function hasVoted(): bool
    {
        return $this->decision !== null;
    }
}
