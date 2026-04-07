<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowTemplate extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
        'category',
        'author_id',
        'version',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'version' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function statuses(): HasMany
    {
        return $this->hasMany(WorkflowTemplateStatus::class, 'template_id')->orderBy('position');
    }

    public function transitions(): HasMany
    {
        return $this->hasMany(WorkflowTemplateTransition::class, 'template_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'workflow_template_id');
    }
}
