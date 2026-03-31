<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Projects\Models\WorkflowTransition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

final class WorkflowController extends Controller
{
    public function index(Project $project): Response
    {
        $this->authorizeManage($project);

        $statuses = $project->workflowStatuses()->get();
        $transitions = $project->workflowTransitions()
            ->with(['fromStatus:id,name', 'toStatus:id,name'])
            ->get();

        return Inertia::render('Projects/Workflow', [
            'project' => $project->only('id', 'name', 'key'),
            'statuses' => $statuses,
            'transitions' => $transitions,
        ]);
    }

    public function storeStatus(Request $request, Project $project): JsonResponse
    {
        $this->authorizeManage($project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:7'],
            'is_initial' => ['boolean'],
            'is_done' => ['boolean'],
            'is_cancelled' => ['boolean'],
            'allow_transition_from_any' => ['boolean'],
        ]);

        $maxPosition = $project->workflowStatuses()->max('position') ?? -1;
        $slug = Str::slug($validated['name']);

        // Zajistit unikátnost slugu
        $baseSlug = $slug;
        $counter = 1;
        while ($project->workflowStatuses()->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        // Pokud nový stav je initial, odebrat flag z ostatních
        if (! empty($validated['is_initial'])) {
            $project->workflowStatuses()->update(['is_initial' => false]);
        }

        $status = $project->workflowStatuses()->create([
            ...$validated,
            'slug' => $slug,
            'position' => $maxPosition + 1,
        ]);

        return response()->json($status, 201);
    }

    public function updateStatus(Request $request, Project $project, WorkflowStatus $workflowStatus): JsonResponse
    {
        $this->authorizeManage($project);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:7'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'is_initial' => ['sometimes', 'boolean'],
            'is_done' => ['sometimes', 'boolean'],
            'is_cancelled' => ['sometimes', 'boolean'],
            'allow_transition_from_any' => ['sometimes', 'boolean'],
        ]);

        if (! empty($validated['is_initial'])) {
            $project->workflowStatuses()->where('id', '!=', $workflowStatus->id)->update(['is_initial' => false]);
        }

        $workflowStatus->update($validated);

        return response()->json($workflowStatus);
    }

    public function destroyStatus(Project $project, WorkflowStatus $workflowStatus): JsonResponse
    {
        $this->authorizeManage($project);

        // Přesun úkolů do předchozího stavu
        $previous = $project->workflowStatuses()
            ->where('position', '<', $workflowStatus->getAttribute('position'))
            ->orderByDesc('position')
            ->first();

        if ($previous) {
            $project->tasks()
                ->where('workflow_status_id', $workflowStatus->id)
                ->update(['workflow_status_id' => $previous->getAttribute('id')]);
        }

        $workflowStatus->delete();

        return response()->json(['success' => true]);
    }

    public function storeTransition(Request $request, Project $project): JsonResponse
    {
        $this->authorizeManage($project);

        $validated = $request->validate([
            'from_status_id' => ['required', 'uuid', 'exists:workflow_statuses,id'],
            'to_status_id' => ['required', 'uuid', 'exists:workflow_statuses,id', 'different:from_status_id'],
        ]);

        $transition = $project->workflowTransitions()->firstOrCreate([
            'from_status_id' => $validated['from_status_id'],
            'to_status_id' => $validated['to_status_id'],
        ]);

        return response()->json($transition, 201);
    }

    public function destroyTransition(Project $project, WorkflowTransition $workflowTransition): JsonResponse
    {
        $this->authorizeManage($project);

        $workflowTransition->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Vytvořit výchozí workflow pro projekt (6 stavů + přechody).
     */
    public static function seedDefaultWorkflow(Project $project): void
    {
        $statuses = [
            ['name' => 'Backlog', 'slug' => 'backlog', 'color' => '#97a0af', 'position' => 0, 'is_initial' => true],
            ['name' => 'K zpracování', 'slug' => 'todo', 'color' => '#4c9aff', 'position' => 1],
            ['name' => 'V průběhu', 'slug' => 'in_progress', 'color' => '#0065ff', 'position' => 2],
            ['name' => 'V revizi', 'slug' => 'in_review', 'color' => '#8777d9', 'position' => 3],
            ['name' => 'Hotovo', 'slug' => 'done', 'color' => '#36b37e', 'position' => 4, 'is_done' => true],
            ['name' => 'Zrušeno', 'slug' => 'cancelled', 'color' => '#6b778c', 'position' => 5, 'is_cancelled' => true, 'allow_transition_from_any' => true],
        ];

        $created = [];
        foreach ($statuses as $s) {
            $created[$s['slug']] = $project->workflowStatuses()->create([
                'name' => $s['name'],
                'slug' => $s['slug'],
                'color' => $s['color'] ?? null,
                'position' => $s['position'],
                'is_initial' => $s['is_initial'] ?? false,
                'is_done' => $s['is_done'] ?? false,
                'is_cancelled' => $s['is_cancelled'] ?? false,
                'allow_transition_from_any' => $s['allow_transition_from_any'] ?? false,
            ]);
        }

        $transitions = [
            ['backlog', 'todo'],
            ['todo', 'in_progress'],
            ['todo', 'backlog'],
            ['in_progress', 'in_review'],
            ['in_progress', 'todo'],
            ['in_review', 'done'],
            ['in_review', 'in_progress'],
            ['done', 'in_progress'],
            ['cancelled', 'backlog'],
        ];

        foreach ($transitions as [$from, $to]) {
            $project->workflowTransitions()->create([
                'from_status_id' => $created[$from]->id,
                'to_status_id' => $created[$to]->id,
            ]);
        }
    }

    private function authorizeManage(Project $project): void
    {
        $user = request()->user();
        $isOwner = $project->getAttribute('owner_id') === $user->id;
        $isPm = $project->epics()->where('pm_id', $user->id)->exists();

        if (! $isOwner && ! $isPm) {
            abort(403, 'Pouze vlastník projektu nebo PM může spravovat workflow.');
        }
    }
}
