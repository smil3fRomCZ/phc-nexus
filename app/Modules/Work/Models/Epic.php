<?php

declare(strict_types=1);

namespace App\Modules\Work\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\EpicStatus;
use Database\Factories\EpicFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Epic extends Model
{
    /** @use HasFactory<EpicFactory> */
    use Auditable, HasAttachments, HasComments, HasFactory, HasPhiClassification, HasUuidV7, SoftDeletes;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'status',
        'data_classification',
        'owner_id',
        'sort_order',
        'start_date',
        'target_date',
    ];

    protected function casts(): array
    {
        return [
            'status' => EpicStatus::class,
            'start_date' => 'date',
            'target_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Epic $epic): void {
            if ($epic->number === null) {
                $epic->number = (int) DB::table('epics')
                    ->where('project_id', $epic->project_id)
                    ->max('number') + 1;
            }
        });
    }

    protected static function newFactory(): EpicFactory
    {
        return EpicFactory::new();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
