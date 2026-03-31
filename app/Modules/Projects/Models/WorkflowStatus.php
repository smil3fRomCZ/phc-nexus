<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\HasUuidV7;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStatus extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'project_id',
        'name',
        'slug',
        'color',
        'position',
        'pos_x',
        'pos_y',
        'is_initial',
        'is_done',
        'is_cancelled',
        'allow_transition_from_any',
    ];

    protected function casts(): array
    {
        return [
            'is_initial' => 'boolean',
            'is_done' => 'boolean',
            'is_cancelled' => 'boolean',
            'allow_transition_from_any' => 'boolean',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function transitionsFrom(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'from_status_id');
    }

    public function transitionsTo(): HasMany
    {
        return $this->hasMany(WorkflowTransition::class, 'to_status_id');
    }

    /**
     * Může se z tohoto stavu přejít do cílového?
     */
    public function canTransitionTo(self $target): bool
    {
        if ($target->allow_transition_from_any) {
            return true;
        }

        return $this->transitionsFrom()->where('to_status_id', $target->id)->exists();
    }

    /**
     * Povolené cílové stavy z tohoto stavu.
     */
    public function allowedTargets(): Collection
    {
        $explicit = WorkflowStatus::whereIn(
            'id',
            $this->transitionsFrom()->select('to_status_id')
        )->get();

        $global = WorkflowStatus::where('project_id', $this->project_id)
            ->where('allow_transition_from_any', true)
            ->where('id', '!=', $this->id)
            ->get();

        return $explicit->merge($global)->unique('id')->sortBy('position')->values();
    }
}
