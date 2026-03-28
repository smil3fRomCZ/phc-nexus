<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\EpicStatus;
use App\Modules\Work\Models\Epic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class EpicController extends Controller
{
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $epics = $project->epics()
            ->with('owner:id,name')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Work/Epics/Index', [
            'project' => $project->only('id', 'name', 'key'),
            'epics' => $epics,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('view', $project);
        Gate::authorize('create', Epic::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(EpicStatus::cases(), 'value'))],
            'owner_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $project->epics()->create($validated);

        return back()->with('success', 'Epik vytvořen.');
    }

    public function show(Project $project, Epic $epic): Response
    {
        Gate::authorize('view', $epic);

        $epic->load([
            'owner:id,name',
            'tasks.assignee:id,name',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $epic->loadCount(['tasks', 'attachments', 'comments']);

        $members = $project->members()
            ->select('users.id', 'users.name')
            ->get()
            ->when($project->owner_id, fn ($col) => $col->push($project->owner()->select('id', 'name')->first()))
            ->unique('id')
            ->values();

        $statuses = collect(EpicStatus::cases())
            ->map(fn (EpicStatus $s) => ['value' => $s->value, 'label' => $s->label()]);

        return Inertia::render('Work/Epics/Show', [
            'project' => $project->only('id', 'name', 'key'),
            'epic' => $epic,
            'members' => $members,
            'statuses' => $statuses,
        ]);
    }

    public function update(Request $request, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('update', $epic);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:'.implode(',', array_column(EpicStatus::cases(), 'value'))],
            'owner_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $epic->update($validated);

        return back()->with('success', 'Epik aktualizován.');
    }

    public function destroy(Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('delete', $epic);

        $epic->delete();

        return redirect()->route('projects.epics.index', $project)
            ->with('success', 'Epik smazán.');
    }
}
