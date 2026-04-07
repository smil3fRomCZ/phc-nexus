<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\WorkflowTemplate;
use App\Modules\Projects\Models\WorkflowTemplateStatus;
use App\Modules\Projects\Models\WorkflowTemplateTransition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowTemplateController extends Controller
{
    public function index(): Response
    {
        $templates = WorkflowTemplate::with(['author:id,name'])
            ->withCount(['statuses', 'transitions', 'projects'])
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();

        return Inertia::render('Projects/WorkflowTemplates', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'in:software,task_management,approval,custom'],
        ]);

        WorkflowTemplate::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'author_id' => $request->user()->id,
            'published_at' => now(),
        ]);

        return back()->with('success', 'Šablona vytvořena.');
    }

    public function show(WorkflowTemplate $template): Response
    {
        $template->load(['statuses', 'transitions.fromStatus', 'transitions.toStatus', 'author:id,name']);

        return Inertia::render('Projects/WorkflowTemplateEdit', [
            'template' => $template,
        ]);
    }

    public function addStatus(Request $request, WorkflowTemplate $template): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $maxPos = $template->statuses()->max('position') ?? -1;

        $template->statuses()->create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'position' => $maxPos + 1,
        ]);

        return back();
    }

    public function updateStatus(Request $request, WorkflowTemplate $template, WorkflowTemplateStatus $status): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'is_initial' => ['sometimes', 'boolean'],
            'is_done' => ['sometimes', 'boolean'],
            'is_cancelled' => ['sometimes', 'boolean'],
            'allow_transition_from_any' => ['sometimes', 'boolean'],
        ]);

        $status->update($data);

        return back();
    }

    public function deleteStatus(WorkflowTemplate $template, WorkflowTemplateStatus $status): RedirectResponse
    {
        $status->delete();

        return back();
    }

    public function addTransition(Request $request, WorkflowTemplate $template): RedirectResponse
    {
        $validated = $request->validate([
            'from_status_id' => ['required', 'uuid', 'exists:workflow_template_statuses,id'],
            'to_status_id' => ['required', 'uuid', 'exists:workflow_template_statuses,id', 'different:from_status_id'],
        ]);

        WorkflowTemplateTransition::firstOrCreate([
            'template_id' => $template->id,
            'from_status_id' => $validated['from_status_id'],
            'to_status_id' => $validated['to_status_id'],
        ]);

        return back();
    }

    public function deleteTransition(WorkflowTemplate $template, WorkflowTemplateTransition $transition): RedirectResponse
    {
        $transition->delete();

        return back();
    }

    /**
     * Aplikovat šablonu na projekt — zkopíruje stavy a přechody.
     */
    public function applyToProject(Request $request, WorkflowTemplate $template, Project $project): RedirectResponse
    {
        // Smazat stávající workflow (pokud nemá tasks)
        $hasTasksWithStatus = $project->tasks()
            ->whereNotNull('workflow_status_id')
            ->exists();

        if (! $hasTasksWithStatus) {
            $project->workflowTransitions()->delete();
            $project->workflowStatuses()->delete();
        }

        $statusMap = [];
        foreach ($template->statuses as $ts) {
            $ws = $project->workflowStatuses()->create([
                'name' => $ts->name,
                'slug' => $ts->slug,
                'color' => $ts->color,
                'position' => $ts->position,
                'is_initial' => $ts->is_initial,
                'is_done' => $ts->is_done,
                'is_cancelled' => $ts->is_cancelled,
                'allow_transition_from_any' => $ts->allow_transition_from_any,
            ]);
            $statusMap[$ts->id] = $ws->getAttribute('id');
        }

        foreach ($template->transitions as $tt) {
            if (isset($statusMap[$tt->from_status_id], $statusMap[$tt->to_status_id])) {
                $project->workflowTransitions()->create([
                    'from_status_id' => $statusMap[$tt->from_status_id],
                    'to_status_id' => $statusMap[$tt->to_status_id],
                ]);
            }
        }

        $project->update(['workflow_template_id' => $template->id]);

        return back()->with('success', 'Workflow šablona aplikována.');
    }

    public function destroy(WorkflowTemplate $template): RedirectResponse
    {
        if ($template->is_system) {
            return back()->with('error', 'Systémovou šablonu nelze smazat.');
        }

        $template->delete();

        return back()->with('success', 'Šablona smazána.');
    }
}
