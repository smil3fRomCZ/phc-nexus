<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\HasAttachments;
use App\Models\Concerns\HasComments;
use App\Models\Concerns\HasPhiClassification;
use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use App\Modules\Estimation\Models\EstimationSession;
use App\Modules\Organization\Models\Team;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Enums\ProjectStatus;
use App\Modules\Projects\Enums\ProjectType;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property array{order: list<string>, hidden: list<string>}|null $tab_config
 */
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use Auditable, HasAttachments, HasComments, HasFactory, HasPhiClassification, HasUuidV7, SoftDeletes;

    protected $fillable = [
        'name',
        'key',
        'description',
        'status',
        'project_type',
        'workflow_template_id',
        'data_classification',
        'owner_id',
        'team_id',
        'start_date',
        'target_date',
        'benefit_type',
        'benefit_amount',
        'benefit_note',
        'tab_config',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'project_type' => ProjectType::class,
            'start_date' => 'date',
            'target_date' => 'date',
            'benefit_type' => BenefitType::class,
            'benefit_amount' => 'decimal:2',
            'tab_config' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function wikiPages(): HasMany
    {
        return $this->hasMany(WikiPage::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(EstimationSession::class);
    }

    public function workflowStatuses(): HasMany
    {
        return $this->hasMany(WorkflowStatus::class)->orderBy('position');
    }

    public function workflowTransitions(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class);
    }

    public function initialWorkflowStatus(): ?Model
    {
        return $this->workflowStatuses()->where('is_initial', true)->first();
    }

    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }

    public function hasMember(User $user): bool
    {
        return $this->owner_id === $user->id
            || $this->members()->where('user_id', $user->id)->exists();
    }
}
