<?php

declare(strict_types=1);

namespace App\Modules\Work\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use Auditable, HasAttachments, HasComments, HasFactory, HasPhiClassification, HasUuidV7, SoftDeletes;

    protected $fillable = [
        'project_id',
        'epic_id',
        'title',
        'description',
        'status',
        'priority',
        'data_classification',
        'assignee_id',
        'reporter_id',
        'sort_order',
        'due_date',
        'recurrence_rule',
        'recurrence_next_at',
        'recurrence_source_id',
        'benefit_type',
        'benefit_amount',
        'benefit_note',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_date' => 'date',
            'recurrence_rule' => RecurrenceRule::class,
            'recurrence_next_at' => 'date',
            'benefit_type' => BenefitType::class,
            'benefit_amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Task $task): void {
            if ($task->number === null) {
                $task->number = (int) DB::table('tasks')
                    ->where('project_id', $task->project_id)
                    ->max('number') + 1;
            }
        });
    }

    protected static function newFactory(): TaskFactory
    {
        return TaskFactory::new();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    /** Tasks that block this task. */
    public function blockers(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'blocked_id', 'blocker_id')
            ->withTimestamps();
    }

    /** Tasks that this task blocks. */
    public function blocking(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'task_dependencies', 'blocker_id', 'blocked_id')
            ->withTimestamps();
    }

    public function approvalRequests(): MorphMany
    {
        return $this->morphMany(ApprovalRequest::class, 'approvable');
    }

    public function hasPendingApproval(): bool
    {
        return $this->approvalRequests()->where('status', 'pending')->exists();
    }
}
