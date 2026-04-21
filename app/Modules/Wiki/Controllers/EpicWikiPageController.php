<?php

declare(strict_types=1);

namespace App\Modules\Wiki\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use App\Modules\Work\Models\Epic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;

final class EpicWikiPageController extends Controller
{
    public function index(Project $project, Epic $epic): Response
    {
        Gate::authorize('view', $epic);

        $pages = $epic->wikiPages()
            ->whereNull('parent_id')
            ->with(['author:id,name', 'children.author:id,name', 'children.children.author:id,name'])
            ->orderBy('position')
            ->get();

        return Inertia::render('Wiki/EpicIndex', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'epic' => $epic->only('id', 'title', 'number'),
            'pages' => $pages,
        ]);
    }

    public function store(Request $request, Project $project, Epic $epic): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $this->ensureEpicBelongsToProject($project, $epic);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', $this->epicParentRule($project, $epic)],
        ]);

        $maxPosition = $epic->wikiPages()
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('position') ?? -1;

        $page = $epic->wikiPages()->create([
            ...$validated,
            'project_id' => $project->id,
            'author_id' => $request->user()->id,
            'position' => $maxPosition + 1,
        ]);

        return redirect()->route('projects.epics.wiki.show', [$project, $epic, $page])
            ->with('success', 'Stránka dokumentace vytvořena.');
    }

    public function show(Project $project, Epic $epic, WikiPage $wikiPage): Response
    {
        Gate::authorize('view', $epic);

        $this->ensureEpicBelongsToProject($project, $epic);
        $this->ensureWikiPageBelongsToEpic($project, $epic, $wikiPage);

        $wikiPage->load([
            'author:id,name',
            'parent:id,title',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $wikiPage->loadCount(['comments']);

        $pages = $epic->wikiPages()
            ->whereNull('parent_id')
            ->with(['children.children'])
            ->orderBy('position')
            ->get(['id', 'title', 'parent_id', 'position']);

        return Inertia::render('Wiki/EpicShow', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'epic' => $epic->only('id', 'title', 'number'),
            'page' => $wikiPage,
            'pages' => $pages,
        ]);
    }

    public function update(Request $request, Project $project, Epic $epic, WikiPage $wikiPage): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $this->ensureEpicBelongsToProject($project, $epic);
        $this->ensureWikiPageBelongsToEpic($project, $epic, $wikiPage);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', $this->epicParentRule($project, $epic, $wikiPage)],
        ]);

        $wikiPage->update($validated);

        return back()->with('success', 'Stránka dokumentace aktualizována.');
    }

    public function destroy(Project $project, Epic $epic, WikiPage $wikiPage): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $this->ensureEpicBelongsToProject($project, $epic);
        $this->ensureWikiPageBelongsToEpic($project, $epic, $wikiPage);

        $wikiPage->delete();

        return redirect()->route('projects.epics.wiki.index', [$project, $epic])
            ->with('success', 'Stránka dokumentace smazána.');
    }

    /**
     * parent_id musí patřit do stejného epicu (a tím pádem i projektu).
     * Pro update zakazujeme self-reference.
     */
    private function epicParentRule(Project $project, Epic $epic, ?WikiPage $excluding = null): Exists
    {
        $rule = Rule::exists('wiki_pages', 'id')
            ->where('project_id', $project->id)
            ->where('epic_id', $epic->id);

        if ($excluding !== null) {
            $rule->whereNot('id', $excluding->id);
        }

        return $rule;
    }

    private function ensureEpicBelongsToProject(Project $project, Epic $epic): void
    {
        if ($epic->project_id !== $project->id) {
            abort(404);
        }
    }

    private function ensureWikiPageBelongsToEpic(Project $project, Epic $epic, WikiPage $wikiPage): void
    {
        if ($wikiPage->project_id !== $project->id || $wikiPage->epic_id !== $epic->id) {
            abort(404);
        }
    }
}
