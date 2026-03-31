<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Notifications\Notifications\TaskAssignedNotification;
use App\Modules\Notifications\Notifications\TaskStatusChangedNotification;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Enums\TaskPriority;
use App\Modules\Work\Enums\TaskStatus;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use Illuminate\Database\Eloquent\Model;
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
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
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
            'blockers:id,title,status,project_id',
            'blocking:id,title,status,project_id',
        ]);
        $task->loadCount(['attachments', 'comments']);

        /** @var TaskStatus $status */
        $status = $task->status;
        $allowedTransitions = collect($status->allowedTransitions())
            ->map(fn (TaskStatus $s) => ['value' => $s->value, 'label' => $s->label()])
            ->values()
            ->all();

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $statuses = collect(TaskStatus::cases())
            ->map(fn (TaskStatus $s) => ['value' => $s->value, 'label' => $s->label()]);

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

        $statusLabels = collect(TaskStatus::cases())->mapWithKeys(fn (TaskStatus $s) => [$s->value => $s->label()]);
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
                if (! empty($values['status']) && $statusLabels->has($values['status'])) {
                    $values['status'] = $statusLabels[$values['status']];
                }
                if (! empty($values['priority']) && $priorityLabels->has($values['priority'])) {
                    $values['priority'] = $priorityLabels[$values['priority']];
                }
                foreach (['due_date', 'start_date', 'target_date', 'recurrence_next_at'] as $dateField) {
                    if (! empty($values[$dateField]) && is_string($values[$dateField])) {
                        try {
                            $values[$dateField] = \Carbon\Carbon::parse($values[$dateField])->format('d.m.Y');
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
            'project' => $project->only('id', 'name', 'key'),
            'task' => $task,
            'hasPendingApproval' => $task->hasPendingApproval(),
            'allowedTransitions' => $allowedTransitions,
            'members' => $members,
            'statuses' => $statuses,
            'priorities' => $priorities,
            'activity' => $activity,
            'projectTasks' => $projectTasks,
            'recurrenceRules' => $recurrenceRules,
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
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
            'priority' => ['required', 'string', 'in:'.implode(',', array_column(TaskPriority::cases(), 'value'))],
            'assignee_id' => ['nullable', 'uuid', 'exists:users,id'],
            'reporter_id' => ['nullable', 'uuid', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
        ]);

        $oldAssigneeId = $task->assignee_id;
        /** @var TaskStatus $oldStatus */
        $oldStatus = $task->status;

        $task->update($validated);

        if (($validated['assignee_id'] ?? null) !== null
            && $validated['assignee_id'] !== $oldAssigneeId
            && $task->assignee !== null
        ) {
            $task->assignee->notify(new TaskAssignedNotification($task, $request->user()));
        }

        /** @var TaskStatus $newStatus */
        $newStatus = $task->status;
        if ($oldStatus !== $newStatus && $task->assignee !== null) {
            $task->assignee->notify(new TaskStatusChangedNotification($task, $oldStatus, $newStatus));
        }

        return back()->with('success', 'Úkol aktualizován.');
    }

    /**
     * Kanban board — všechny úkoly projektu seskupené podle statusu.
     */
    public function board(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = $project->tasks()
            ->with(['assignee:id,name', 'reporter:id,name', 'epic:id,title'])
            ->withCount('comments')
            ->orderBy('sort_order');

        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->input('assignee_id'));
        }
        if ($request->filled('epic_id')) {
            $query->where('epic_id', $request->input('epic_id'));
        }

        $tasks = $query->get();

        $columns = collect(TaskStatus::boardColumns())->map(fn (TaskStatus $status) => [
            'status' => $status->value,
            'label' => $status->label(),
            'tasks' => $tasks->where('status', $status)->values(),
        ]);

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $epics = $project->epics()->orderBy('title')->get(['id', 'title']);

        return Inertia::render('Work/Tasks/Board', [
            'project' => $project->only('id', 'name', 'key'),
            'columns' => $columns,
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

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
        ]);

        $newStatus = TaskStatus::from($validated['status']);

        if ($task->hasPendingApproval()) {
            return response()->json([
                'error' => 'Tento úkol má nevyřízenou žádost o schválení. Před změnou stavu je nutné žádost schválit nebo zamítnout.',
            ], 422);
        }

        if (! $task->status->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => "Přechod z '{$task->status->label()}' na '{$newStatus->label()}' není povolený.",
            ]);
        }

        /** @var TaskStatus $oldStatus */
        $oldStatus = $task->status;
        $task->update(['status' => $newStatus]);

        $task->load('assignee');
        if ($task->assignee !== null) {
            $task->assignee->notify(new TaskStatusChangedNotification($task, $oldStatus, $newStatus));
        }

        return response()->json(['success' => true]);
    }

    public function bulkUpdateStatus(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['uuid'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
        ]);

        $newStatus = TaskStatus::from($validated['status']);

        Task::where('project_id', $project->id)
            ->whereIn('id', $validated['task_ids'])
            ->update(['status' => $newStatus]);

        return response()->json(['success' => true, 'count' => count($validated['task_ids'])]);
    }

    public function destroy(Project $project, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return redirect()->route('projects.tasks.index', $project)
            ->with('success', 'Úkol smazán.');
    }
}
