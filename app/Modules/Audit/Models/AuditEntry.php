<?php

declare(strict_types=1);

namespace App\Modules\Audit\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Append-only audit entry. No updates or deletes allowed.
 */
class AuditEntry extends Model
{
    use HasUuidV7;

    const UPDATED_AT = null;

    protected $fillable = [
        'action',
        'entity_type',
        'entity_id',
        'actor_id',
        'payload',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'action' => AuditAction::class,
            'payload' => 'array',
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function entity(): MorphTo
    {
        return $this->morphTo('entity');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
