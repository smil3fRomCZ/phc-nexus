<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class OrganizationController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $divisions = Division::query()
            ->with([
                'teams.members:id,name,email,team_id,system_role,status',
                'teams.teamLead:id,name',
            ])
            ->orderBy('name')
            ->get();

        $users = User::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Organization/Index', [
            'divisions' => $divisions,
            'users' => $users,
            'can' => [
                'createDivision' => Gate::allows('create', Division::class),
                'createTeam' => Gate::allows('create', Team::class),
            ],
        ]);
    }

    public function storeDivision(Request $request): RedirectResponse
    {
        Gate::authorize('create', Division::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        Division::create($validated);

        return redirect()->route('admin.organization')
            ->with('success', 'Divize vytvořena.');
    }

    public function updateDivision(Request $request, Division $division): RedirectResponse
    {
        Gate::authorize('update', $division);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $division->update($validated);

        return redirect()->route('admin.organization')
            ->with('success', 'Divize aktualizována.');
    }

    public function destroyDivision(Division $division): RedirectResponse
    {
        Gate::authorize('delete', $division);

        $division->delete();

        return redirect()->route('admin.organization')
            ->with('success', 'Divize smazána.');
    }

    public function storeTeam(Request $request): RedirectResponse
    {
        Gate::authorize('create', Team::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'division_id' => ['required', 'uuid', 'exists:divisions,id'],
            'team_lead_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        Team::create($validated);

        return redirect()->route('admin.organization')
            ->with('success', 'Tým vytvořen.');
    }

    public function updateTeam(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('update', $team);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'division_id' => ['required', 'uuid', 'exists:divisions,id'],
            'team_lead_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $team->update($validated);

        return redirect()->route('admin.organization')
            ->with('success', 'Tým aktualizován.');
    }

    public function destroyTeam(Team $team): RedirectResponse
    {
        Gate::authorize('delete', $team);

        $team->delete();

        return redirect()->route('admin.organization')
            ->with('success', 'Tým smazán.');
    }
}
