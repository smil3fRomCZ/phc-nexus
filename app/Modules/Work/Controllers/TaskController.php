<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class TaskController extends Controller
{
    public function index(Project $project, ?Epic $epic = null): Response
    {
        Gate::authorize('view', $project);

        $query = $epic
            ? $epic->tasks()
            : $project->tasks()->whereNull('epic_id');

        $tasks = $query
            ->with(['assignee:id,name', 'reporter:id,name'])
            ->orderBy('sort_order')
            ->get();

        $props = [
            'project' => $project->only('id', 'name', 'key'),
            'tasks' => $tasks,
        ];

        if ($epic) {
            $props['epic'] = $epic->only('id', 'title');
        }

        return Inertia::render('Work/Tasks/Index', $props);
    }

    public function store(Request $request, Project $project, ?Epic $epic = null): RedirectResponse
    {
        Gate::authorize('view', $project);
        Gate::authorize('create', Task::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
            'priority' => ['required', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'reporter_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $validated['project_id'] = $project->id;
        if ($epic) {
            $validated['epic_id'] = $epic->id;
        }

        Task::create($validated);

        return back()->with('success', 'Úkol vytvořen.');
    }

    public function show(Project $project, Task $task): Response
    {
        Gate::authorize('view', $task);

        $task->load([
            'assignee:id,name',
            'reporter:id,name',
            'epic:id,title',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $task->loadCount(['attachments', 'comments']);

        /** @var TaskStatus $status */
        $status = $task->status;
        $allowedTransitions = collect($status->allowedTransitions())
            ->map(fn (TaskStatus $s) => ['value' => $s->value, 'label' => $s->label()])
            ->values()
            ->all();

        return Inertia::render('Work/Tasks/Show', [
            'project' => $project->only('id', 'name', 'key'),
            'task' => $task,
            'allowedTransitions' => $allowedTransitions,
        ]);
    }

    public function update(Request $request, Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
            'priority' => ['required', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'reporter_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task->update($validated);

        return back()->with('success', 'Úkol aktualizován.');
    }

    /**
     * Kanban board — všechny úkoly projektu seskupené podle statusu.
     */
    public function board(Project $project): Response
    {
        Gate::authorize('view', $project);

        $tasks = $project->tasks()
            ->with(['assignee:id,name', 'epic:id,title'])
            ->orderBy('sort_order')
            ->get();

        $columns = collect(TaskStatus::boardColumns())->map(fn (TaskStatus $status) => [
            'status' => $status->value,
            'label' => $status->label(),
            'tasks' => $tasks->where('status', $status)->values(),
        ]);

        return Inertia::render('Work/Tasks/Board', [
            'project' => $project->only('id', 'name', 'key'),
            'columns' => $columns,
        ]);
    }

    /**
     * Tabulkový view — seznam úkolů s řazením a filtrem.
     */
    public function table(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = $project->tasks()
            ->with(['assignee:id,name', 'reporter:id,name', 'epic:id,title']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->input('assignee_id'));
        }

        $sortField = $request->input('sort', 'sort_order');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['sort_order', 'title', 'status', 'priority', 'due_date', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $tasks = $query->get();

        return Inertia::render('Work/Tasks/Table', [
            'project' => $project->only('id', 'name', 'key'),
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority', 'assignee_id', 'sort', 'dir']),
            'statuses' => collect(TaskStatus::cases())->map(fn (TaskStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
            'priorities' => collect(TaskPriority::cases())->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]),
        ]);
    }

    /**
     * PATCH — rychlá změna statusu (drag&drop na kanban boardu).
     */
    public function updateStatus(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
        ]);

        $newStatus = TaskStatus::from($validated['status']);

        if (! $task->status->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => "Přechod z '{$task->status->label()}' na '{$newStatus->label()}' není povolený.",
            ]);
        }

        $task->update(['status' => $newStatus]);

        return response()->json(['success' => true]);
    }

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return redirect()->route('projects.tasks.index', $project)
            ->with('success', 'Úkol smazán.');
    }
}
