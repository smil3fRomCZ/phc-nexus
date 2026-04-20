<?php

declare(strict_types=1);

namespace App\Modules\Wiki\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;

final class WikiPageController extends Controller
{
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $pages = $project->wikiPages()
            ->whereNull('parent_id')
            ->with(['author:id,name', 'children.author:id,name', 'children.children.author:id,name'])
            ->orderBy('position')
            ->get();

        return Inertia::render('Wiki/Index', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'pages' => $pages,
        ]);
    }

    public function show(Project $project, WikiPage $wikiPage): Response
    {
        Gate::authorize('view', $project);

        $this->ensureWikiPageBelongsToProject($project, $wikiPage);

        $wikiPage->load([
            'author:id,name',
            'parent:id,title',
            'rootComments.author:id,name',
            'rootComments.replies.author:id,name',
            'attachments.uploader:id,name',
        ]);
        $wikiPage->loadCount(['comments']);

        $pages = $project->wikiPages()
            ->whereNull('parent_id')
            ->with(['children.children'])
            ->orderBy('position')
            ->get(['id', 'title', 'parent_id', 'position']);

        return Inertia::render('Wiki/Show', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'page' => $wikiPage,
            'pages' => $pages,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', $this->projectParentRule($project)],
        ]);

        $maxPosition = $project->wikiPages()
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('position') ?? -1;

        $page = $project->wikiPages()->create([
            ...$validated,
            'author_id' => $request->user()->id,
            'position' => $maxPosition + 1,
        ]);

        return redirect()->route('projects.wiki.show', [$project, $page])
            ->with('success', 'Stránka dokumentace vytvořena.');
    }

    public function update(Request $request, Project $project, WikiPage $wikiPage): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $this->ensureWikiPageBelongsToProject($project, $wikiPage);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', $this->projectParentRule($project, $wikiPage)],
        ]);

        $wikiPage->update($validated);

        return back()->with('success', 'Stránka dokumentace aktualizována.');
    }

    /**
     * parent_id musí patřit do stejného projektu a zároveň NEbýt epic stránka.
     * Pro update navíc zakazujeme self-reference (stránka nemůže být svým
     * vlastním rodičem; cycle detection řeší tree integrita mimo scope).
     */
    private function projectParentRule(Project $project, ?WikiPage $excluding = null): Exists
    {
        $rule = Rule::exists('wiki_pages', 'id')
            ->where('project_id', $project->id)
            ->whereNull('epic_id');

        if ($excluding !== null) {
            $rule->whereNot('id', $excluding->id);
        }

        return $rule;
    }

    /**
     * Route model binding ověří existenci stránky, ne ale vazbu na projekt
     * v URL. Bez tohoto checku by útočník mohl editovat cizí stránku přes
     * `/projects/{vlastní}/wiki/{cizí-id}`. Vracíme 404 (nepotvrdit existenci
     * stránky v jiném projektu).
     */
    private function ensureWikiPageBelongsToProject(Project $project, WikiPage $wikiPage): void
    {
        if ($wikiPage->project_id !== $project->id || $wikiPage->epic_id !== null) {
            abort(404);
        }
    }

    public function destroy(Project $project, WikiPage $wikiPage): RedirectResponse
    {
        Gate::authorize('contribute', $project);

        $this->ensureWikiPageBelongsToProject($project, $wikiPage);

        $wikiPage->delete();

        return redirect()->route('projects.wiki.index', $project)
            ->with('success', 'Stránka dokumentace smazána.');
    }
}
