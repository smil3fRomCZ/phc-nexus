<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Organization\Models\Team;
use App\Modules\Projects\Enums\BenefitType;
use App\Modules\Projects\Enums\ProjectStatus;
use App\Modules\Projects\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $projects = Project::query()
            ->with(['owner:id,name', 'team:id,name'])
            ->withCount(['members', 'tasks', 'tasks as tasks_completed_count' => fn ($q) => $q->where('status', 'done')])
            ->when($request->user()->system_role->value === 'team_member', function ($query) use ($request) {
                $query->where(function ($q) use ($request) {
                    $q->where('owner_id', $request->user()->id)
                        ->orWhereHas('members', fn ($m) => $m->where('user_id', $request->user()->id));
                });
            })
            ->latest()
            ->paginate(20);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Project::class);

        return Inertia::render('Projects/Create', [
            'existingKeys' => Project::pluck('key')->toArray(),
            'classifications' => collect(PhiClassification::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
            'teams' => Team::orderBy('name')->get(['id', 'name']),
            'benefitTypes' => collect(BenefitType::cases())->map(fn ($b) => [
                'value' => $b->value,
                'label' => $b->label(),
                'hasMoney' => $b->hasMoneyField(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Project::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'key' => ['required', 'string', 'max:10', 'unique:projects,key', 'regex:/^[A-Z][A-Z0-9-]*$/'],
            'description' => ['nullable', 'string'],
            'data_classification' => ['nullable', 'string', 'in:'.implode(',', array_column(PhiClassification::cases(), 'value'))],
            'team_id' => ['nullable', 'uuid', 'exists:teams,id'],
            'start_date' => ['nullable', 'date'],
            'target_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
        ]);

        $project = Project::create([
            ...$validated,
            'status' => ProjectStatus::Draft,
            'data_classification' => $validated['data_classification'] ?? PhiClassification::NonPhi->value,
            'owner_id' => $request->user()->id,
        ]);

        // Owner je automaticky člen
        $project->members()->attach($request->user()->id, ['role' => 'owner']);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Projekt vytvořen.');
    }

    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load([
            'owner:id,name,email',
            'team:id,name',
            'members:id,name,email',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $project->loadCount([
            'attachments',
            'comments',
            'tasks',
            'tasks as tasks_completed_count' => fn ($q) => $q->where('status', 'done'),
            'tasks as tasks_overdue_count' => fn ($q) => $q->whereNotIn('status', ['done', 'cancelled'])->whereNotNull('due_date')->where('due_date', '<', now()),
            'epics',
            'members',
        ]);

        $timeEntries = $project->timeEntries()
            ->with(['user:id,name', 'task:id,title,number', 'epic:id,title'])
            ->latest('date')
            ->get();
        $totalHours = (float) $project->timeEntries()->sum('hours');

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'timeEntries' => $timeEntries,
            'totalHours' => $totalHours,
        ]);
    }

    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'statuses' => collect(ProjectStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
            'classifications' => collect(PhiClassification::cases())->map(fn ($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
            'teams' => Team::orderBy('name')->get(['id', 'name']),
            'benefitTypes' => collect(BenefitType::cases())->map(fn ($b) => [
                'value' => $b->value,
                'label' => $b->label(),
                'hasMoney' => $b->hasMoneyField(),
            ]),
        ]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(ProjectStatus::cases(), 'value'))],
            'data_classification' => ['nullable', 'string', 'in:'.implode(',', array_column(PhiClassification::cases(), 'value'))],
            'team_id' => ['nullable', 'uuid', 'exists:teams,id'],
            'start_date' => ['nullable', 'date'],
            'target_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'benefit_type' => ['nullable', 'string', 'in:'.implode(',', array_column(BenefitType::cases(), 'value'))],
            'benefit_amount' => ['nullable', 'numeric', 'min:0'],
            'benefit_note' => ['nullable', 'string'],
        ]);

        $project->update($validated);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Projekt aktualizován.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Projekt archivován.');
    }
}
