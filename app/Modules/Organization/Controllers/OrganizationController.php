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
            ->withCount('teams')
            ->with(['teams' => fn ($q) => $q->withCount('members')])
            ->orderBy('name')
            ->get();

        // Add member_count to each division
        $divisions->each(function (Division $div): void {
            $div->setAttribute('member_count', $div->teams->sum('members_count'));
        });

        $stats = [
            'totalUsers' => User::where('status', 'active')->count(),
            'totalDivisions' => Division::count(),
            'totalTeams' => Team::count(),
            'unassigned' => User::where('status', 'active')->whereNull('team_id')->count(),
        ];

        $users = User::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Organization/Index', [
            'divisions' => $divisions,
            'stats' => $stats,
            'users' => $users,
            'can' => [
                'createDivision' => Gate::allows('create', Division::class),
                'createTeam' => Gate::allows('create', Team::class),
            ],
        ]);
    }

    public function showDivision(Division $division): Response
    {
        $division->load([
            'teams.teamLead:id,name',
            'teams' => fn ($q) => $q->withCount('members')->orderBy('name'),
        ]);

        $users = User::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Organization/DivisionShow', [
            'division' => $division,
            'users' => $users,
            'can' => [
                'editDivision' => Gate::allows('update', $division),
                'deleteDivision' => Gate::allows('delete', $division),
                'createTeam' => Gate::allows('create', Team::class),
            ],
        ]);
    }

    public function showTeam(Team $team): Response
    {
        $team->load([
            'division:id,name',
            'teamLead:id,name',
            'members:id,name,email,system_role,status,job_title,team_id',
        ]);

        $users = User::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Organization/TeamShow', [
            'team' => $team,
            'users' => $users,
            'can' => [
                'editTeam' => Gate::allows('update', $team),
                'deleteTeam' => Gate::allows('delete', $team),
                'manageMembers' => Gate::allows('manageMembers', $team),
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

        return redirect()->back()
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

        return redirect()->back()
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

        return redirect()->back()
            ->with('success', 'Tým aktualizován.');
    }

    public function destroyTeam(Team $team): RedirectResponse
    {
        Gate::authorize('delete', $team);

        $team->delete();

        return redirect()->back()
            ->with('success', 'Tým smazán.');
    }

    public function addMember(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('manageMembers', $team);

        $validated = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,id'],
        ]);

        User::where('id', $validated['user_id'])->update(['team_id' => $team->id]);

        return redirect()->back()
            ->with('success', 'Člen přidán do týmu.');
    }

    public function removeMember(Team $team, User $user): RedirectResponse
    {
        Gate::authorize('manageMembers', $team);

        if ($user->team_id === $team->id) {
            $user->update(['team_id' => null]);
        }

        return redirect()->back()
            ->with('success', 'Člen odebrán z týmu.');
    }
}
