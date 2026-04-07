<?php

declare(strict_types=1);

namespace App\Modules\Estimation\Models;

use App\Models\Concerns\HasUuidV7;
use App\Modules\Work\Models\Task;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstimationRound extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'session_id',
        'task_id',
        'round_number',
        'final_value',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'round_number' => 'integer',
            'final_value' => 'integer',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(EstimationSession::class, 'session_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(EstimationVote::class, 'round_id');
    }
}
