<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $myTasks = Task::query()
            ->with(['project:id,name,key', 'workflowStatus:id,name,color'])
            ->where('assignee_id', $user->id)
            ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false))
            ->orderByRaw('CASE WHEN due_date IS NOT NULL AND due_date < ? THEN 0 ELSE 1 END', [now()])
            ->orderBy('due_date')
            ->limit(10)
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id', 'workflow_status_id']);

        $pendingApprovals = ApprovalRequest::query()
            ->with(['requester:id,name', 'approvable'])
            ->where('status', 'pending')
            ->whereHas('votes', function ($q) use ($user) {
                $q->where('voter_id', $user->id)->whereNull('decision');
            })
            ->latest()
            ->limit(6)
            ->get(['id', 'description', 'status', 'requester_id', 'approvable_type', 'approvable_id', 'created_at'])
            ->map(function (ApprovalRequest $approval) {
                $projectId = match (true) {
                    $approval->approvable instanceof Task => $approval->approvable->project_id,
                    $approval->approvable instanceof Project => $approval->approvable->id,
                    default => null,
                };

                return [
                    'id' => $approval->id,
                    'description' => $approval->description,
                    'status' => $approval->status,
                    'requester' => $approval->requester,
                    'created_at' => $approval->created_at,
                    'project_id' => $projectId,
                ];
            });

        $stats = [
            'active_tasks' => Task::where('assignee_id', $user->id)
                ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false)->where('is_initial', false))
                ->count(),
            'pending_approvals' => $pendingApprovals->count(),
            'overdue' => Task::where('assignee_id', $user->id)
                ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false))
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())
                ->count(),
            'my_projects' => Project::where('owner_id', $user->id)
                ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id))
                ->count(),
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'myTasks' => $myTasks,
            'pendingApprovals' => $pendingApprovals,
        ]);
    }
}
