<?php

declare(strict_types=1);

namespace App\Modules\Work\Actions;

use App\Models\User;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;

final class CreateTask
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(Project $project, ?Epic $epic, User $creator, array $attributes): Task
    {
        $attributes['project_id'] = $project->id;
        $attributes['reporter_id'] ??= $creator->id;
        if ($epic) {
            $attributes['epic_id'] = $epic->id;
        }

        $today = now()->toDateString();
        $attributes['start_date'] ??= $today;
        $attributes['due_date'] ??= $today;

        if ($project->workflowStatuses()->count() === 0) {
            WorkflowController::seedDefaultWorkflow($project);
        }

        /** @var WorkflowStatus|null $initialStatus */
        $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();
        /** @var WorkflowStatus $fallbackStatus */
        $fallbackStatus = $initialStatus ?? $project->workflowStatuses()->orderBy('position')->firstOrFail();
        $attributes['workflow_status_id'] = $fallbackStatus->id;

        return Task::create($attributes);
    }
}
