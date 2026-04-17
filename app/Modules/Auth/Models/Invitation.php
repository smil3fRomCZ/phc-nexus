<?php

declare(strict_types=1);

namespace App\Modules\Auth\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Team;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'email',
        'token',
        'token_hash',
        'system_role',
        'team_id',
        'invited_by',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'system_role' => SystemRole::class,
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // DB ukládá jen SHA256 hash; plaintext `token` jde do URL/mailu.
        // Auto-hash zachovává kompatibilitu s testovacími fixtures, které
        // vytvářejí invitation jen s `token`.
        static::saving(function (self $invitation): void {
            if ($invitation->token !== null && $invitation->token !== '' && empty($invitation->token_hash)) {
                $invitation->token_hash = hash('sha256', (string) $invitation->token);
            }
        });
    }

    public static function findActiveByToken(string $plaintext): ?self
    {
        return self::query()
            ->where('token_hash', hash('sha256', $plaintext))
            ->whereNull('accepted_at')
            ->first();
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function isPending(): bool
    {
        return ! $this->isAccepted() && ! $this->isExpired();
    }
}
