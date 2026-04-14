<?php

declare(strict_types=1);

namespace App\Modules\Work\Actions;

use App\Modules\Notifications\Notifications\TaskStatusChangedNotification;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Task;

final class ChangeTaskStatus
{
    public const RESULT_OK = 'ok';

    public const RESULT_PENDING_APPROVAL = 'pending_approval';

    public const RESULT_INVALID_TRANSITION = 'invalid_transition';

    /**
     * @return array{status: string, message?: string}
     */
    public function execute(Task $task, string $targetStatusId): array
    {
        if ($task->hasPendingApproval()) {
            return [
                'status' => self::RESULT_PENDING_APPROVAL,
                'message' => 'Tento úkol má nevyřízenou žádost o schválení. Před změnou stavu je nutné žádost schválit nebo zamítnout.',
            ];
        }

        /** @var WorkflowStatus|null $currentWs */
        $currentWs = $task->workflowStatus;
        /** @var WorkflowStatus|null $targetWs */
        $targetWs = WorkflowStatus::find($targetStatusId);

        if ($currentWs instanceof WorkflowStatus && $targetWs instanceof WorkflowStatus) {
            if (! $currentWs->canTransitionTo($targetWs)) {
                return [
                    'status' => self::RESULT_INVALID_TRANSITION,
                    'message' => "Přechod z '{$currentWs->name}' na '{$targetWs->name}' není povolený.",
                ];
            }
        }

        $task->update(['workflow_status_id' => $targetStatusId]);

        $task->load('assignee');
        if ($currentWs && $targetWs && $task->assignee !== null) {
            $task->assignee->notify(new TaskStatusChangedNotification($task, $currentWs, $targetWs));
        }

        return ['status' => self::RESULT_OK];
    }
}
