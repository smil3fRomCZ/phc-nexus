<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
use App\Modules\Organization\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class UserController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', User::class);

        $query = User::query()
            ->with(['team:id,name']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('system_role', $request->input('role'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('team_id')) {
            if ($request->input('team_id') === '_none') {
                $query->whereNull('team_id');
            } else {
                $query->where('team_id', $request->input('team_id'));
            }
        }

        $sortField = $request->input('sort', 'name');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'email', 'system_role', 'status', 'created_at'];
        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'name';
        }

        $users = $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc')->get();

        $teams = Team::query()->orderBy('name')->get(['id', 'name']);

        $allUsers = User::query();
        $stats = [
            'total' => (clone $allUsers)->count(),
            'active' => (clone $allUsers)->where('status', UserStatus::Active)->count(),
            'invited' => (clone $allUsers)->where('status', UserStatus::Invited)->count(),
            'deactivated' => (clone $allUsers)->where('status', UserStatus::Deactivated)->count(),
            'roles' => collect(SystemRole::cases())
                ->map(fn (SystemRole $r) => [
                    'role' => $r->value,
                    'label' => $r->label(),
                    'count' => User::where('system_role', $r->value)->count(),
                ]),
        ];

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status', 'team_id', 'sort', 'dir']),
            'roles' => collect(SystemRole::cases())
                ->map(fn (SystemRole $r) => ['value' => $r->value, 'label' => $r->label()]),
            'statuses' => collect(UserStatus::cases())
                ->map(fn (UserStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
            'teams' => $teams,
            'stats' => $stats,
        ]);
    }

    public function show(User $user): Response
    {
        Gate::authorize('view', $user);

        $user->load(['team:id,name']);

        // Direct reports: users in teams where this user is team lead
        $directReports = User::query()
            ->whereIn('team_id', Team::where('team_lead_id', $user->id)->select('id'))
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'system_role', 'status', 'job_title', 'team_id'])
            ->load('team:id,name');

        $teams = Team::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'directReports' => $directReports,
            'teams' => $teams,
            'roles' => collect(SystemRole::cases())
                ->map(fn (SystemRole $r) => ['value' => $r->value, 'label' => $r->label()]),
            'statuses' => collect(UserStatus::cases())
                ->map(fn (UserStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
            'can' => [
                'edit' => Gate::allows('updateUser', $user),
                'deactivate' => Gate::allows('deactivate', $user),
            ],
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('updateUser', $user);

        $validated = $request->validate([
            'system_role' => ['sometimes', 'string', 'in:'.implode(',', array_column(SystemRole::cases(), 'value'))],
            'team_id' => ['sometimes', 'nullable', 'exists:teams,id'],
            'capacity_h_week' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:168'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $user->update($validated);

        return redirect()->back()
            ->with('success', "Uživatel {$user->name} aktualizován.");
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        Gate::authorize('updateRole', $user);

        $validated = $request->validate([
            'system_role' => ['required', 'string', 'in:'.implode(',', array_column(SystemRole::cases(), 'value'))],
        ]);

        $user->update(['system_role' => $validated['system_role']]);

        return redirect()->route('admin.users.index')
            ->with('success', "Role uživatele {$user->name} aktualizována.");
    }

    public function deactivate(User $user): RedirectResponse
    {
        Gate::authorize('deactivate', $user);

        $user->update(['status' => UserStatus::Deactivated]);

        return redirect()->back()
            ->with('success', "Uživatel {$user->name} deaktivován.");
    }

    public function activate(User $user): RedirectResponse
    {
        Gate::authorize('deactivate', $user);

        $user->update(['status' => UserStatus::Active]);

        return redirect()->back()
            ->with('success', "Uživatel {$user->name} aktivován.");
    }
}
