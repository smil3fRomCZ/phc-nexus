<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectMemberController extends Controller
{
    private const ALLOWED_ROLES = ['member', 'project_manager'];

    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load([
            'owner:id,name,email',
            'members:id,name,email',
        ]);

        $canManage = Gate::allows('manageMembers', $project);

        $availableUsers = $canManage
            ? User::query()
                ->where('status', 'active')
                ->whereNotIn('id', $project->members->pluck('id'))
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
            : [];

        $roleCounts = DB::table('project_members')
            ->where('project_id', $project->id)
            ->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role');

        /** @var list<string> $memberIds */
        $memberIds = $project->members->pluck('id')->map(fn ($id) => (string) $id)->values()->all();
        $usage = $this->bulkUsageSummary($project, $memberIds);

        return Inertia::render('Projects/Members', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'key' => $project->key,
                'status' => $project->status,
                'members' => $project->members,
                'members_count' => $project->members->count(),
                'owner_id' => $project->owner_id,
            ],
            'availableUsers' => $availableUsers,
            'roleCounts' => $roleCounts,
            'usage' => $usage,
            'can' => ['manageMembers' => $canManage],
        ]);
    }

    public function usage(Project $project, User $user): JsonResponse
    {
        Gate::authorize('view', $project);

        return response()->json($this->memberUsageDetail($project, $user));
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
            'role' => ['sometimes', 'string', Rule::in(self::ALLOWED_ROLES)],
        ]);

        $userId = $validated['user_id'];
        $role = $validated['role'] ?? 'member';

        if ($project->members()->where('user_id', $userId)->exists()) {
            return redirect()->back()->with('error', 'Uživatel je již členem projektu.');
        }

        $project->members()->attach($userId, ['role' => $role]);

        return redirect()->back()->with('success', 'Člen přidán.');
    }

    public function updateRole(Request $request, Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        $member = $project->members()->where('user_id', $user->id)->first();

        if (! $member) {
            abort(404);
        }

        /** @var string $currentRole */
        $currentRole = $member->pivot->getAttribute('role');

        if ($currentRole === 'owner') {
            return redirect()->back()->with('error', 'Nelze změnit roli vlastníka.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
        ]);

        $project->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        return redirect()->back()->with('success', 'Role aktualizována.');
    }

    public function destroy(Request $request, Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        if ($project->owner_id === $user->id) {
            return redirect()->back()->with('error', 'Nelze odebrat vlastníka projektu.');
        }

        $validated = $request->validate([
            'reassignments' => ['sometimes', 'array'],
            'reassignments.*' => ['uuid', 'exists:users,id'],
        ]);

        $openTaskIds = Task::query()
            ->where('project_id', $project->id)
            ->where('assignee_id', $user->id)
            ->whereHas('workflowStatus', function ($q): void {
                $q->where('is_done', false)->where('is_cancelled', false);
            })
            ->pluck('id');

        $reassignments = $validated['reassignments'] ?? [];
        $missing = $openTaskIds->reject(fn ($id) => array_key_exists((string) $id, $reassignments));

        if ($missing->isNotEmpty()) {
            return redirect()->back()->with(
                'error',
                'Nelze odebrat člena: má '.$missing->count().' nepřeřazených otevřených úkolů.',
            );
        }

        $memberIds = DB::table('project_members')
            ->where('project_id', $project->id)
            ->pluck('user_id')
            ->map(fn ($id) => (string) $id)
            ->reject(fn ($id) => $id === $user->id)
            ->all();

        foreach ($reassignments as $taskId => $newAssigneeId) {
            if (! in_array((string) $newAssigneeId, $memberIds, true)) {
                return redirect()->back()->with(
                    'error',
                    'Nový assignee musí být členem projektu.',
                );
            }
        }

        DB::transaction(function () use ($project, $user, $reassignments): void {
            foreach ($reassignments as $taskId => $newAssigneeId) {
                Task::query()
                    ->where('id', $taskId)
                    ->where('project_id', $project->id)
                    ->where('assignee_id', $user->id)
                    ->update(['assignee_id' => $newAssigneeId]);
            }
            $project->members()->detach($user->id);
        });

        return redirect()->back()->with('success', 'Člen odebrán.');
    }

    /**
     * @param  list<string>  $memberIds
     * @return array<string, array{open_tasks: int, done_tasks: int, hours: float}>
     */
    private function bulkUsageSummary(Project $project, array $memberIds): array
    {
        if ($memberIds === []) {
            return [];
        }

        $openCounts = Task::query()
            ->where('project_id', $project->id)
            ->whereIn('assignee_id', $memberIds)
            ->whereHas('workflowStatus', function ($q): void {
                $q->where('is_done', false)->where('is_cancelled', false);
            })
            ->selectRaw('assignee_id, count(*) as c')
            ->groupBy('assignee_id')
            ->pluck('c', 'assignee_id');

        $doneCounts = Task::query()
            ->where('project_id', $project->id)
            ->whereIn('assignee_id', $memberIds)
            ->whereHas('workflowStatus', function ($q): void {
                $q->where('is_done', true);
            })
            ->selectRaw('assignee_id, count(*) as c')
            ->groupBy('assignee_id')
            ->pluck('c', 'assignee_id');

        $hours = TimeEntry::query()
            ->where('project_id', $project->id)
            ->whereIn('user_id', $memberIds)
            ->selectRaw('user_id, sum(hours) as h')
            ->groupBy('user_id')
            ->pluck('h', 'user_id');

        $result = [];
        foreach ($memberIds as $id) {
            $result[$id] = [
                'open_tasks' => (int) ($openCounts[$id] ?? 0),
                'done_tasks' => (int) ($doneCounts[$id] ?? 0),
                'hours' => (float) ($hours[$id] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return array{
     *     member: array{id: string, name: string, email: string},
     *     open_tasks: int,
     *     done_tasks: int,
     *     hours: float,
     *     comments: int,
     *     tasks: list<array{id: string, number: int, title: string, status: string, due_date: string|null}>,
     *     reassignable_members: list<array{id: string, name: string, role: string}>
     * }
     */
    private function memberUsageDetail(Project $project, User $user): array
    {
        $openTaskRows = DB::table('tasks')
            ->leftJoin('workflow_statuses', 'tasks.workflow_status_id', '=', 'workflow_statuses.id')
            ->where('tasks.project_id', $project->id)
            ->where('tasks.assignee_id', $user->id)
            ->where('workflow_statuses.is_done', false)
            ->where('workflow_statuses.is_cancelled', false)
            ->orderBy('tasks.due_date')
            ->get([
                'tasks.id',
                'tasks.number',
                'tasks.title',
                'tasks.due_date',
                'workflow_statuses.name as status_name',
            ]);

        $doneTasksCount = DB::table('tasks')
            ->leftJoin('workflow_statuses', 'tasks.workflow_status_id', '=', 'workflow_statuses.id')
            ->where('tasks.project_id', $project->id)
            ->where('tasks.assignee_id', $user->id)
            ->where('workflow_statuses.is_done', true)
            ->count();

        $hours = (float) TimeEntry::query()
            ->where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->sum('hours');

        $commentsCount = DB::table('comments')
            ->where('author_id', $user->id)
            ->where(function ($q) use ($project): void {
                $q->where(function ($qq) use ($project): void {
                    $qq->where('commentable_type', Project::class)
                        ->where('commentable_id', $project->id);
                })->orWhereIn('commentable_id', function ($qq) use ($project): void {
                    $qq->select('id')
                        ->from('tasks')
                        ->where('project_id', $project->id);
                });
            })
            ->count();

        $reassignableRows = DB::table('project_members')
            ->join('users', 'project_members.user_id', '=', 'users.id')
            ->where('project_members.project_id', $project->id)
            ->where('project_members.user_id', '!=', $user->id)
            ->orderBy('users.name')
            ->get(['users.id', 'users.name', 'project_members.role']);

        $tasks = [];
        foreach ($openTaskRows as $row) {
            $tasks[] = [
                'id' => (string) $row->id,
                'number' => (int) $row->number,
                'title' => (string) $row->title,
                'status' => (string) ($row->status_name ?? '—'),
                'due_date' => $row->due_date !== null ? substr((string) $row->due_date, 0, 10) : null,
            ];
        }

        $reassignable = [];
        foreach ($reassignableRows as $row) {
            $reassignable[] = [
                'id' => (string) $row->id,
                'name' => (string) $row->name,
                'role' => (string) $row->role,
            ];
        }

        return [
            'member' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'open_tasks' => count($tasks),
            'done_tasks' => $doneTasksCount,
            'hours' => $hours,
            'comments' => $commentsCount,
            'tasks' => $tasks,
            'reassignable_members' => $reassignable,
        ];
    }
}
