<?php

declare(strict_types=1);

namespace App\Modules\Work\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Stub — plná implementace přijde v feat/m3-task-model.
 */
class Task extends Model
{
    use Auditable, HasAttachments, HasComments, HasPhiClassification, HasUuidV7, SoftDeletes;

    protected $fillable = [
        'epic_id',
        'project_id',
        'title',
        'description',
        'status',
        'data_classification',
        'assignee_id',
        'reporter_id',
        'sort_order',
        'due_date',
    ];

    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}
