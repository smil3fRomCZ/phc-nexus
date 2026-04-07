<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\HasUuidV7;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTemplateStatus extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'template_id',
        'name',
        'slug',
        'color',
        'position',
        'is_initial',
        'is_done',
        'is_cancelled',
        'allow_transition_from_any',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_initial' => 'boolean',
            'is_done' => 'boolean',
            'is_cancelled' => 'boolean',
            'allow_transition_from_any' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class, 'template_id');
    }
}
