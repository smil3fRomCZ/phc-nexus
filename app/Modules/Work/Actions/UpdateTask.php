<?php

declare(strict_types=1);

namespace App\Modules\Work\Actions;

use App\Models\User;
use App\Modules\Notifications\Notifications\TaskAssignedNotification;
use App\Modules\Notifications\Notifications\TaskStatusChangedNotification;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Task;

final class UpdateTask
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(Task $task, User $editor, array $attributes): Task
    {
        $oldAssigneeId = $task->assignee_id;
        $oldWorkflowStatusId = $task->workflow_status_id;

        $task->update($attributes);

        if (($attributes['assignee_id'] ?? null) !== null
            && $attributes['assignee_id'] !== $oldAssigneeId
            && $task->assignee !== null
        ) {
            $task->assignee->notify(new TaskAssignedNotification($task, $editor));
        }

        if ($oldWorkflowStatusId !== $task->workflow_status_id && $task->assignee !== null) {
            /** @var WorkflowStatus|null $oldWs */
            $oldWs = WorkflowStatus::find($oldWorkflowStatusId);
            /** @var WorkflowStatus|null $newWs */
            $newWs = $task->workflowStatus;
            if ($oldWs && $newWs) {
                $task->assignee->notify(new TaskStatusChangedNotification($task, $oldWs, $newWs));
            }
        }

        return $task;
    }
}
