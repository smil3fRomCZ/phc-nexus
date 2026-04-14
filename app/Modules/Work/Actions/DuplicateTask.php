<?php

declare(strict_types=1);

namespace App\Modules\Work\Actions;

use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Task;

final class DuplicateTask
{
    public function execute(Project $project, Task $task): Task
    {
        $clone = $task->replicate(['id', 'number', 'created_at', 'updated_at']);
        $clone->title = $task->title.' (kopie)';

        /** @var WorkflowStatus|null $initialStatus */
        $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();
        if ($initialStatus) {
            $clone->workflow_status_id = $initialStatus->id;
        }
        $clone->save();

        return $clone;
    }
}
