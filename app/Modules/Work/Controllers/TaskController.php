<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Notifications\Notifications\TaskAssignedNotification;
use App\Modules\Notifications\Notifications\TaskStatusChangedNotification;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class TaskController extends Controller
{
    public function index(Request $request, Project $project, ?Epic $epic = null): Response|JsonResponse
    {
        Gate::authorize('view', $project);

        $query = $epic
            ? $epic->tasks()
            : $project->tasks();

        // JSON response pro API volání (např. estimation session create)
        if ($request->input('format') === 'json') {
            $tasks = $query->select('id', 'number', 'title', 'story_points')
                ->orderBy('number')
                ->get();

            return response()->json(['tasks' => $tasks]);
        }

        $tasks = $query
            ->when(! $epic, fn ($q) => $q->whereNull('epic_id'))
            ->with(['assignee:id,name', 'reporter:id,name', 'workflowStatus:id,name,color'])
            ->orderBy('sort_order')
            ->get();

        $props = [
            'project' => $project->only('id', 'name', 'key', 'status'),
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
            'priority' => ['required', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'reporter_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'story_points' => ['nullable', 'integer', 'in:1,2,3,5,8,13,21'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
        ]);

        $validated['project_id'] = $project->id;
        $validated['reporter_id'] ??= $request->user()->id;
        if ($epic) {
            $validated['epic_id'] = $epic->id;
        }

        // Automaticky přiřadit initial workflow status (seed default pokud chybí)
        if ($project->workflowStatuses()->count() === 0) {
            WorkflowController::seedDefaultWorkflow($project);
        }
        /** @var WorkflowStatus|null $initialStatus */
        $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();
        /** @var WorkflowStatus $fallbackStatus */
        $fallbackStatus = $initialStatus ?? $project->workflowStatuses()->orderBy('position')->firstOrFail();
        $validated['workflow_status_id'] = $fallbackStatus->id;

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
            'workflowStatus:id,name,color,is_done,is_cancelled',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
            'blockers:id,title,project_id',
            'blocking:id,title,project_id',
        ]);
        $task->loadCount(['attachments', 'comments']);

        $allowedTransitions = [];
        /** @var WorkflowStatus|null $ws */
        $ws = $task->workflowStatus;
        if ($ws) {
            $allowedTransitions = $ws->allowedTargets()
                ->map(fn (Model $s) => ['value' => $s->getAttribute('id'), 'label' => $s->getAttribute('name'), 'color' => $s->getAttribute('color')])
                ->values()
                ->all();
        }

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $statuses = $project->workflowStatuses()
            ->orderBy('position')
            ->get()
            ->map(fn (Model $s) => ['value' => $s->getAttribute('id'), 'label' => $s->getAttribute('name'), 'color' => $s->getAttribute('color')]);

        $priorities = collect(TaskPriority::cases())
            ->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]);

        $activity = $task->auditEntries()
            ->with('actor:id,name')
            ->latest('created_at')
            ->limit(50)
            ->get(['id', 'action', 'actor_id', 'old_values', 'new_values', 'created_at']);

        // Resolvovat user ID na jména a enum hodnoty na labely
        $userIds = collect();
        /** @var AuditEntry $entry */
        foreach ($activity as $entry) {
            foreach (['old_values', 'new_values'] as $key) {
                $values = $entry->getAttribute($key);
                if (! is_array($values)) {
                    continue;
                }
                foreach (['assignee_id', 'reporter_id'] as $field) {
                    if (! empty($values[$field])) {
                        $userIds->push($values[$field]);
                    }
                }
            }
        }
        $userNames = $userIds->unique()->isNotEmpty()
            ? User::whereIn('id', $userIds->unique())->pluck('name', 'id')
            : collect();

        $statusLabels = WorkflowStatus::where('project_id', $project->id)->pluck('name', 'id');
        $priorityLabels = collect(TaskPriority::cases())->mapWithKeys(fn (TaskPriority $p) => [$p->value => $p->label()]);

        $activity->transform(function (Model $entry) use ($userNames, $statusLabels, $priorityLabels) {
            foreach (['old_values', 'new_values'] as $key) {
                /** @var array<string, mixed>|null $values */
                $values = $entry->getAttribute($key);
                if (! is_array($values)) {
                    continue;
                }
                foreach (['assignee_id', 'reporter_id'] as $field) {
                    if (! empty($values[$field]) && $userNames->has($values[$field])) {
                        $values[$field] = $userNames[$values[$field]];
                    } elseif (array_key_exists($field, $values) && empty($values[$field])) {
                        $values[$field] = null;
                    }
                }
                if (! empty($values['workflow_status_id']) && $statusLabels->has($values['workflow_status_id'])) {
                    $values['workflow_status_id'] = $statusLabels[$values['workflow_status_id']];
                }
                if (! empty($values['priority']) && $priorityLabels->has($values['priority'])) {
                    $values['priority'] = $priorityLabels[$values['priority']];
                }
                foreach (['due_date', 'start_date', 'target_date', 'recurrence_next_at'] as $dateField) {
                    if (! empty($values[$dateField]) && is_string($values[$dateField])) {
                        try {
                            $values[$dateField] = Carbon::parse($values[$dateField])->format('d.m.Y');
                        } catch (\Throwable) {
                            // ponechat původní hodnotu
                        }
                    }
                }
                $entry->setAttribute($key, $values);
            }

            return $entry;
        });

        $projectTasks = $project->tasks()
            ->where('id', '!=', $task->id)
            ->orderBy('title')
            ->get(['id', 'title']);

        $recurrenceRules = collect(RecurrenceRule::cases())
            ->map(fn (RecurrenceRule $r) => ['value' => $r->value, 'label' => $r->label()]);

        return Inertia::render('Work/Tasks/Show', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'task' => $task,
            'hasPendingApproval' => $task->hasPendingApproval(),
            'allowedTransitions' => $allowedTransitions,
            'members' => $members,
            'statuses' => $statuses,
            'priorities' => $priorities,
            'activity' => $activity,
            'projectTasks' => $projectTasks,
            'recurrenceRules' => $recurrenceRules,
            'timeEntries' => $task->timeEntries()
                ->with('user:id,name')
                ->latest('date')
                ->get(),
            'totalHours' => (float) $task->timeEntries()->sum('hours'),
            'benefitTypes' => collect(BenefitType::cases())->map(fn ($b) => [
                'value' => $b->value,
                'label' => $b->label(),
                'hasMoney' => $b->hasMoneyField(),
            ]),
        ]);
    }

    public function setRecurrence(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'recurrence_rule' => ['nullable', 'string', 'in:'.implode(',', array_column(RecurrenceRule::cases(), 'value'))],
        ]);

        $rule = $validated['recurrence_rule'] ?? null;

        $task->update([
            'recurrence_rule' => $rule,
            'recurrence_next_at' => $rule
                ? RecurrenceRule::from($rule)->nextDate($task->due_date ?? now())->format('Y-m-d')
                : null,
        ]);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'workflow_status_id' => ['required', 'uuid', 'exists:workflow_statuses,id'],
            'priority' => ['required', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'reporter_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'story_points' => ['nullable', 'integer', 'in:1,2,3,5,8,13,21'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
        ]);

        $oldAssigneeId = $task->assignee_id;
        $oldWorkflowStatusId = $task->workflow_status_id;

        $task->update($validated);

        if (($validated['assignee_id'] ?? null) !== null
            && $validated['assignee_id'] !== $oldAssigneeId
            && $task->assignee !== null
        ) {
            $task->assignee->notify(new TaskAssignedNotification($task, $request->user()));
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

        return back()->with('success', 'Úkol aktualizován.');
    }

    /**
     * PATCH — částečný update (description apod.).
     */
    public function updatePartial(Request $request, Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'description' => ['nullable', 'string'],
        ]);

        $task->update($validated);

        return back()->with('success', 'Úkol aktualizován.');
    }

    /**
     * Kanban board — všechny úkoly projektu seskupené podle statusu.
     */
    public function board(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = $project->tasks()
            ->with(['assignee:id,name', 'reporter:id,name', 'epic:id,title', 'workflowStatus:id,name,color'])
            ->withCount('comments')
            ->orderBy('sort_order');

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->input('assignee_id'));
        }
        if ($request->filled('epic_id')) {
            $query->where('epic_id', $request->input('epic_id'));
        }

        $tasks = $query->get();

        // Workflow statuses jako sloupce
        $workflowStatuses = $project->workflowStatuses()->orderBy('position')->get();
        $columns = $workflowStatuses
            ->filter(fn (Model $ws) => ! $ws->getAttribute('is_cancelled') || $tasks->where('workflow_status_id', $ws->getAttribute('id'))->isNotEmpty())
            ->map(fn (Model $ws) => [
                'id' => $ws->getAttribute('id'),
                'status' => $ws->getAttribute('id'),
                'label' => $ws->getAttribute('name'),
                'color' => $ws->getAttribute('color'),
                'is_done' => $ws->getAttribute('is_done'),
                'is_cancelled' => $ws->getAttribute('is_cancelled'),
                'tasks' => $tasks->where('workflow_status_id', $ws->getAttribute('id'))->values(),
            ])
            ->values();

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $epics = $project->epics()->orderBy('title')->get(['id', 'title']);

        $user = $request->user();
        $canManageColumns = $user->isExecutive()
            || $project->getAttribute('owner_id') === $user->id
            || $project->epics()->where('pm_id', $user->id)->exists();

        return Inertia::render('Work/Tasks/Board', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'columns' => $columns,
            'canManageColumns' => $canManageColumns,
            'members' => $members,
            'epics' => $epics,
            'filters' => $request->only(['assignee_id', 'epic_id']),
            'boardSettings' => $request->user()->board_settings ?? ['card_fields' => ['priority', 'assignee', 'comments_count']],
        ]);
    }

    /**
     * Tabulkový view — seznam úkolů s řazením a filtrem.
     */
    public function table(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = $project->tasks()
            ->with(['assignee:id,name', 'reporter:id,name', 'epic:id,title', 'workflowStatus:id,name,color']);

        if ($request->filled('status')) {
            if ($request->input('status') === 'overdue') {
                $query->whereNotNull('due_date')
                    ->where('due_date', '<', now()->toDateString())
                    ->whereHas('workflowStatus', fn ($q) => $q->where('is_done', false)->where('is_cancelled', false));
            } else {
                $query->where('workflow_status_id', $request->input('status'));
            }
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->input('assignee_id'));
        }

        $sortField = $request->input('sort', 'sort_order');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['sort_order', 'title', 'priority', 'due_date', 'created_at'];
        if ($sortField === 'status') {
            $query->orderBy(
                WorkflowStatus::select('position')
                    ->whereColumn('workflow_statuses.id', 'tasks.workflow_status_id')
                    ->limit(1),
                $sortDir === 'desc' ? 'desc' : 'asc'
            );
        } elseif (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $tasks = $query->get();

        return Inertia::render('Work/Tasks/Table', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'tasks' => $tasks,
            'filters' => $request->only(['status', 'priority', 'assignee_id', 'sort', 'dir']),
            'statuses' => $project->workflowStatuses()->orderBy('position')->get()
                ->map(fn (Model $s) => ['value' => $s->getAttribute('id'), 'label' => $s->getAttribute('name')]),
            'priorities' => collect(TaskPriority::cases())->map(fn (TaskPriority $p) => ['value' => $p->value, 'label' => $p->label()]),
            'members' => $project->members()
                ->select('users.id', 'users.name')
                ->get()
                ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
                ->unique('id')
                ->values(),
        ]);
    }

    /**
     * PATCH — rychlá změna statusu (drag&drop na kanban boardu).
     */
    public function updateStatus(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        if ($task->hasPendingApproval()) {
            return response()->json([
                'error' => 'Tento úkol má nevyřízenou žádost o schválení. Před změnou stavu je nutné žádost schválit nebo zamítnout.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => ['required', 'uuid', 'exists:workflow_statuses,id'],
        ]);

        /** @var WorkflowStatus|null $currentWs */
        $currentWs = $task->workflowStatus;
        /** @var WorkflowStatus|null $targetWs */
        $targetWs = WorkflowStatus::find($validated['status']);

        if ($currentWs instanceof WorkflowStatus && $targetWs instanceof WorkflowStatus) {
            if (! $currentWs->canTransitionTo($targetWs)) {
                return response()->json([
                    'error' => "Přechod z '{$currentWs->name}' na '{$targetWs->name}' není povolený.",
                ], 422);
            }
        }

        $oldWs = $currentWs;
        $task->update(['workflow_status_id' => $validated['status']]);

        $task->load('assignee');
        if ($oldWs && $targetWs && $task->assignee !== null) {
            $task->assignee->notify(new TaskStatusChangedNotification($task, $oldWs, $targetWs));
        }

        return response()->json(['success' => true]);
    }

    public function bulkUpdateStatus(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['uuid'],
            'status' => ['required', 'uuid', 'exists:workflow_statuses,id'],
        ]);

        Task::where('project_id', $project->id)
            ->whereIn('id', $validated['task_ids'])
            ->update(['workflow_status_id' => $validated['status']]);

        return response()->json(['success' => true, 'count' => count($validated['task_ids'])]);
    }

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return redirect()->route('projects.tasks.table', $project)
            ->with('success', 'Úkol smazán.');
    }

    public function duplicate(Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('create', Task::class);

        $clone = $task->replicate(['id', 'number', 'created_at', 'updated_at']);
        $clone->title = $task->title.' (kopie)';
        /** @var WorkflowStatus|null $initialStatus */
        $initialStatus = $project->workflowStatuses()->where('is_initial', true)->first();
        if ($initialStatus) {
            $clone->workflow_status_id = $initialStatus->id;
        }
        $clone->save();

        return redirect()->route('projects.tasks.show', [$project, $clone])
            ->with('success', 'Úkol duplikován.');
    }
}
