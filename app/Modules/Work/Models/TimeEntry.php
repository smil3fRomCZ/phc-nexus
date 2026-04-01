<?php

declare(strict_types=1);

namespace App\Modules\Work\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Projects\Models\Project;
use Database\Factories\TimeEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntry extends Model
{
    /** @use HasFactory<TimeEntryFactory> */
    use HasFactory, HasUuidV7;

    protected static function newFactory(): TimeEntryFactory
    {
        return TimeEntryFactory::new();
    }

    protected $fillable = [
        'project_id',
        'task_id',
        'epic_id',
        'user_id',
        'date',
        'hours',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'hours' => 'decimal:2',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
