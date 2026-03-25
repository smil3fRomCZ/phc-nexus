<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalMode;
use App\Modules\Approvals\Enums\ApprovalStatus;
use Database\Factories\ApprovalRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ApprovalRequest extends Model
{
    /** @use HasFactory<ApprovalRequestFactory> */
    use Auditable, HasFactory, HasUuidV7, SoftDeletes;

    protected $fillable = [
        'approvable_type',
        'approvable_id',
        'requester_id',
        'status',
        'mode',
        'description',
        'decided_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApprovalStatus::class,
            'mode' => ApprovalMode::class,
            'decided_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function newFactory(): ApprovalRequestFactory
    {
        return ApprovalRequestFactory::new();
    }

    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(ApprovalVote::class);
    }

    public function pendingVotes(): HasMany
    {
        return $this->votes()->whereNull('decision');
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return $this->status === ApprovalStatus::Pending;
    }
}
