<?php

declare(strict_types=1);

namespace App\Modules\Estimation\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Projects\Models\Project;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstimationSession extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'project_id',
        'name',
        'scale_type',
        'status',
        'created_by',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(EstimationRound::class, 'session_id');
    }
}
