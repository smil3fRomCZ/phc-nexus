<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
        ]);
        $task->loadCount(['attachments', 'comments']);

        return Inertia::render('Work/Tasks/Show', [
            'project' => $project->only('id', 'name', 'key'),
            'task' => $task,
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

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return redirect()->route('projects.tasks.index', $project)
            ->with('success', 'Úkol smazán.');
    }
}
