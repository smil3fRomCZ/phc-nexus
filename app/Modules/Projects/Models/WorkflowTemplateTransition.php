<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\HasUuidV7;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTemplateTransition extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'template_id',
        'from_status_id',
        'to_status_id',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class, 'template_id');
    }

    public function fromStatus(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateStatus::class, 'from_status_id');
    }

    public function toStatus(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateStatus::class, 'to_status_id');
    }
}
