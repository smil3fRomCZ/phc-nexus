<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\HasUuidV7;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Models\Tribe;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property string $id
 * @property string $email
 * @property string $name
 * @property SystemRole $system_role
 * @property UserStatus $status
 * @property string|null $team_id
 * @property string|null $avatar_url
 * @property string|null $avatar_path
 */
#[Fillable(['name', 'email', 'password', 'system_role', 'status', 'team_id', 'capacity_h_week', 'board_settings', 'job_title', 'phone', 'bio', 'avatar_url', 'avatar_path'])]
#[Hidden(['password', 'remember_token', 'security_stamp'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuidV7, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'system_role' => SystemRole::class,
            'status' => UserStatus::class,
            'capacity_h_week' => 'decimal:1',
            'board_settings' => 'array',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function tribes(): BelongsToMany
    {
        return $this->belongsToMany(Tribe::class);
    }

    public function isExecutive(): bool
    {
        return $this->system_role === SystemRole::Executive;
    }

    public function isProjectManager(): bool
    {
        return $this->system_role === SystemRole::ProjectManager;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }
}
