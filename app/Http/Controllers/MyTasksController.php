<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
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
            ->with(['project:id,name,key', 'assignee:id,name', 'epic:id,title'])
            ->where('assignee_id', $user->id);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        } else {
            $query->whereNotIn('status', ['done', 'cancelled']);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $tasks = $query
            ->orderByRaw('CASE WHEN due_date IS NOT NULL AND due_date < NOW() THEN 0 ELSE 1 END')
            ->orderBy('due_date')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('MyTasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority']),
            'statuses' => collect(TaskStatus::cases())
                ->map(fn (TaskStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
            'priorities' => collect(TaskPriority::cases())
                ->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]),
        ]);
    }
}
