<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $month = $request->input('month', now()->format('Y-m'));
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        // Projekty kde je uživatel členem nebo vlastníkem
        $projectIds = Project::where(function ($q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
        })->pluck('id');

        $tasks = Task::query()
            ->with(['project:id,name,key', 'workflowStatus:id,name,color,is_done,is_cancelled'])
            ->where(function ($q) use ($user, $projectIds) {
                $q->whereIn('project_id', $projectIds)
                    ->orWhere('assignee_id', $user->id);
            })
            ->whereNotNull('due_date')
            ->where(function ($q) {
                $q->whereDoesntHave('workflowStatus')
                    ->orWhereHas('workflowStatus', fn ($ws) => $ws->where('is_cancelled', false));
            })
            ->whereBetween('due_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('due_date')
            ->get(['id', 'title', 'number', 'priority', 'due_date', 'project_id', 'workflow_status_id', 'assignee_id']);

        return Inertia::render('Calendar/Index', [
            'tasks' => $tasks,
            'month' => $month,
        ]);
    }
}
