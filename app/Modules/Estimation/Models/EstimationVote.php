<?php

declare(strict_types=1);

namespace App\Modules\Estimation\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EstimationVote extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'round_id',
        'user_id',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'integer',
        ];
    }

    public function round(): BelongsTo
    {
        return $this->belongsTo(EstimationRound::class, 'round_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
