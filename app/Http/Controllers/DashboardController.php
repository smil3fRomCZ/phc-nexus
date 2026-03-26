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
            ->with(['project:id,name,key'])
            ->where('assignee_id', $user->id)
            ->whereNotIn('status', ['done', 'cancelled'])
            ->orderByRaw("CASE WHEN due_date IS NOT NULL AND due_date < NOW() THEN 0 ELSE 1 END")
            ->orderBy('due_date')
            ->limit(10)
            ->get(['id', 'title', 'status', 'priority', 'due_date', 'project_id']);

        $pendingApprovals = ApprovalRequest::query()
            ->with(['requester:id,name'])
            ->where('status', 'pending')
            ->whereHas('votes', function ($q) use ($user) {
                $q->where('voter_id', $user->id)->whereNull('decision');
            })
            ->latest()
            ->limit(6)
            ->get(['id', 'description', 'status', 'requester_id', 'created_at']);

        $stats = [
            'active_tasks' => Task::where('assignee_id', $user->id)
                ->whereIn('status', ['in_progress', 'in_review', 'todo'])
                ->count(),
            'pending_approvals' => $pendingApprovals->count(),
            'overdue' => Task::where('assignee_id', $user->id)
                ->whereNotIn('status', ['done', 'cancelled'])
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
