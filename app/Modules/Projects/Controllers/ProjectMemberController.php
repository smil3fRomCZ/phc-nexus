<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Projects\Models\Project;
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

        return Inertia::render('Projects/Members', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'key' => $project->key,
                'status' => $project->status,
                'members' => $project->members,
                'members_count' => $project->members->count(),
            ],
            'availableUsers' => $availableUsers,
            'roleCounts' => $roleCounts,
            'can' => ['manageMembers' => $canManage],
        ]);
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

    public function destroy(Project $project, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        if ($project->owner_id === $user->id) {
            return redirect()->back()->with('error', 'Nelze odebrat vlastníka projektu.');
        }

        $project->members()->detach($user->id);

        return redirect()->back()->with('success', 'Člen odebrán.');
    }
}
