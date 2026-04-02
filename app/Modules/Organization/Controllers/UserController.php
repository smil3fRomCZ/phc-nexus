<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Enums\UserStatus;
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

        $sortField = $request->input('sort', 'name');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'email', 'system_role', 'status', 'created_at'];
        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'name';
        }

        $users = $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc')->get();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status', 'sort', 'dir']),
            'roles' => collect(SystemRole::cases())
                ->map(fn (SystemRole $r) => ['value' => $r->value, 'label' => $r->label()]),
            'statuses' => collect(UserStatus::cases())
                ->map(fn (UserStatus $s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
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

        return redirect()->route('admin.users.index')
            ->with('success', "Uživatel {$user->name} deaktivován.");
    }

    public function activate(User $user): RedirectResponse
    {
        Gate::authorize('deactivate', $user);

        $user->update(['status' => UserStatus::Active]);

        return redirect()->route('admin.users.index')
            ->with('success', "Uživatel {$user->name} aktivován.");
    }
}
