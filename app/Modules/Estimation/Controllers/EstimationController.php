<?php

declare(strict_types=1);

namespace App\Modules\Estimation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Estimation\Models\EstimationRound;
use App\Modules\Estimation\Models\EstimationSession;
use App\Modules\Estimation\Models\EstimationVote;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstimationController extends Controller
{
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $sessions = $project->estimationSessions()
            ->with('creator:id,name')
            ->withCount('rounds')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Estimation/Index', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'sessions' => $sessions,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'scale_type' => ['required', 'string', 'in:fibonacci,tshirt'],
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => ['uuid', Rule::exists('tasks', 'id')->where('project_id', $project->id)],
        ]);

        $session = EstimationSession::create([
            'project_id' => $project->id,
            'name' => $validated['name'],
            'scale_type' => $validated['scale_type'],
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['task_ids'] as $taskId) {
            EstimationRound::create([
                'session_id' => $session->id,
                'task_id' => $taskId,
                'round_number' => 1,
            ]);
        }

        return redirect()->route('projects.estimation.show', [$project, $session])
            ->with('success', 'Estimation session vytvořena.');
    }

    public function show(Project $project, EstimationSession $session): Response
    {
        Gate::authorize('view', $project);

        $session->load([
            'creator:id,name',
            'rounds.task:id,title,number,priority,description,story_points',
            'rounds.votes.user:id,name',
        ]);

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        return Inertia::render('Estimation/Show', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'session' => $session,
            'members' => $members,
        ]);
    }

    public function vote(Request $request, Project $project, EstimationSession $session, EstimationRound $round): RedirectResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'value' => ['required', 'integer', 'in:1,2,3,5,8,13,21'],
        ]);

        EstimationVote::updateOrCreate(
            ['round_id' => $round->id, 'user_id' => $request->user()->id],
            ['value' => $validated['value']],
        );

        return back();
    }

    public function reveal(Project $project, EstimationSession $session, EstimationRound $round): RedirectResponse
    {
        Gate::authorize('view', $project);

        $round->update(['status' => 'revealed']);

        return back();
    }

    public function confirm(Request $request, Project $project, EstimationSession $session, EstimationRound $round): RedirectResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'final_value' => ['required', 'integer', 'in:1,2,3,5,8,13,21'],
        ]);

        $round->update([
            'final_value' => $validated['final_value'],
            'status' => 'confirmed',
        ]);

        // Uložit SP na task
        $round->task->update(['story_points' => $validated['final_value']]);

        return back()->with('success', 'Odhad potvrzen.');
    }

    public function revote(Project $project, EstimationSession $session, EstimationRound $round): RedirectResponse
    {
        Gate::authorize('view', $project);

        $newRound = EstimationRound::create([
            'session_id' => $session->id,
            'task_id' => $round->task_id,
            'round_number' => $round->round_number + 1,
        ]);

        return back()->with('success', 'Nové kolo hlasování zahájeno.');
    }

    public function complete(Project $project, EstimationSession $session): RedirectResponse
    {
        Gate::authorize('view', $project);

        $session->update(['status' => 'completed']);

        return back()->with('success', 'Session dokončena.');
    }
}
