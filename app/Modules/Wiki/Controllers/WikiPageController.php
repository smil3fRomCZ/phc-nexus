<?php

declare(strict_types=1);

namespace App\Modules\Wiki\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', 'exists:wiki_pages,id'],
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
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'uuid', 'exists:wiki_pages,id'],
        ]);

        $wikiPage->update($validated);

        return back()->with('success', 'Stránka dokumentace aktualizována.');
    }

    public function destroy(Project $project, WikiPage $wikiPage): RedirectResponse
    {
        Gate::authorize('view', $project);

        $wikiPage->delete();

        return redirect()->route('projects.wiki.index', $project)
            ->with('success', 'Stránka dokumentace smazána.');
    }
}
