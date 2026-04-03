<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class MyTasksController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $query = Task::query()
            ->with(['project:id,name,key', 'assignee:id,name', 'epic:id,title', 'workflowStatus:id,name,color'])
            ->where('assignee_id', $user->id);

        if ($request->filled('status')) {
            $query->where('workflow_status_id', $request->input('status'));
        } else {
            $query->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $allowedSorts = ['title', 'status', 'priority', 'due_date'];
        $sort = $request->input('sort');
        $dir = $request->input('dir') === 'desc' ? 'desc' : 'asc';

        if ($sort && in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $dir);
        } else {
            $query
                ->orderByRaw('CASE WHEN due_date IS NOT NULL AND due_date < ? THEN 0 ELSE 1 END', [now()])
                ->orderBy('due_date')
                ->orderBy('created_at', 'desc');
        }

        $tasks = $query
            ->paginate(20)
            ->withQueryString();

        // Sesbírat unikátní workflow statuses z projektů uživatele
        $statuses = WorkflowStatus::whereIn('project_id', function ($q) use ($user) {
            $q->select('id')->from('projects')
                ->where('owner_id', $user->id)
                ->orWhereExists(function ($sub) use ($user) {
                    $sub->select('user_id')->from('project_members')
                        ->whereColumn('project_members.project_id', 'projects.id')
                        ->where('user_id', $user->id);
                });
        })->get()->unique('name')->map(fn (WorkflowStatus $s) => ['value' => $s->id, 'label' => $s->name])->values();

        return Inertia::render('MyTasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority', 'sort', 'dir']),
            'statuses' => $statuses,
            'priorities' => collect(TaskPriority::cases())
                ->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]),
        ]);
    }
}
