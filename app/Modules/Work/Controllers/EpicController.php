<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class EpicController extends Controller
{
    public function index(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = $project->epics()
            ->with(['owner:id,name', 'pm:id,name', 'leadDeveloper:id,name'])
            ->withCount('tasks');

        $sortField = $request->input('sort', 'sort_order');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['sort_order', 'number', 'title', 'status', 'priority', 'tasks_count', 'start_date', 'target_date'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $epics = $query->get();

        return Inertia::render('Work/Epics/Index', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'epics' => $epics,
            'filters' => $request->only(['sort', 'dir']),
            'priorities' => collect(TaskPriority::cases())->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]),
            'statuses' => collect(EpicStatus::cases())->map(fn (EpicStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('view', $project);
        Gate::authorize('create', Epic::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(EpicStatus::cases(), 'value'))],
            'priority' => ['nullable', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'owner_id' => ['nullable', 'uuid', 'exists:users,id'],
            'pm_id' => ['nullable', 'uuid', 'exists:users,id'],
            'lead_developer_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $project->epics()->create($validated);

        return back()->with('success', 'Epic vytvořen.');
    }

    public function show(Project $project, Epic $epic): Response
    {
        Gate::authorize('view', $epic);

        $epic->load([
            'owner:id,name',
            'pm:id,name',
            'leadDeveloper:id,name',
            'tasks.assignee:id,name',
            'tasks.workflowStatus:id,name,color',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $epic->loadCount(['tasks', 'attachments', 'comments', 'wikiPages']);

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $statuses = collect(EpicStatus::cases())
            ->map(fn (EpicStatus $s) => ['value' => $s->value, 'label' => $s->label()]);

        $priorities = collect(TaskPriority::cases())
            ->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]);

        // Time entries: přímo na epicu + z podřízených úkolů
        $epicDirectEntries = $epic->timeEntries()->with('user:id,name')->latest('date')->get();
        $taskEntries = TimeEntry::whereIn('task_id', $epic->tasks()->pluck('id'))
            ->with(['user:id,name', 'task:id,title,number'])
            ->latest('date')
            ->get();
        $allTimeEntries = $epicDirectEntries->concat($taskEntries)->sortByDesc('date')->values();
        $epicDirectHours = (float) $epicDirectEntries->sum('hours');
        $taskHours = (float) $taskEntries->sum('hours');

        return Inertia::render('Work/Epics/Show', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'epic' => $epic,
            'members' => $members,
            'statuses' => $statuses,
            'priorities' => $priorities,
            'timeEntries' => $allTimeEntries,
            'epicDirectHours' => $epicDirectHours,
            'taskHours' => $taskHours,
            'totalHours' => $epicDirectHours + $taskHours,
        ]);
    }

    public function update(Request $request, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $epic);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(EpicStatus::cases(), 'value'))],
            'priority' => ['nullable', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'owner_id' => ['nullable', 'uuid', 'exists:users,id'],
            'pm_id' => ['nullable', 'uuid', 'exists:users,id'],
            'lead_developer_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $epic->update($validated);

        return back()->with('success', 'Epic aktualizován.');
    }

    /**
     * PATCH — částečný update (description apod.).
     */
    public function updatePartial(Request $request, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $epic);

        $validated = $request->validate([
            'description' => ['nullable', 'string'],
        ]);

        $epic->update($validated);

        return back()->with('success', 'Epic aktualizován.');
    }

    public function destroy(Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('delete', $epic);

        $epic->delete();

        return redirect()->route('projects.epics.index', $project)
            ->with('success', 'Epic smazán.');
    }

    /**
     * IPA-8: Bulk attach existujících úkolů k epicu. Přijímá pole task_ids,
     * ověří že úkoly patří do stejného projektu, a hromadně nastaví epic_id.
     */
    public function attachTasks(Request $request, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $epic);

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['uuid', 'exists:tasks,id'],
        ]);

        $count = Task::where('project_id', $project->id)
            ->whereIn('id', $validated['task_ids'])
            ->update(['epic_id' => $epic->id]);

        return back()->with('success', "Připojeno {$count} úkolů k epicu.");
    }
}
