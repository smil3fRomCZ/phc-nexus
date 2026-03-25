<?php

declare(strict_types=1);

namespace App\Modules\Organization\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasUuidV7;

    protected $fillable = ['name', 'description', 'division_id', 'team_lead_id'];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function teamLead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'team_lead_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
