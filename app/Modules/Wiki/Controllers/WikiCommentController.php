<?php

declare(strict_types=1);

namespace App\Modules\Wiki\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Comments\Actions\AddComment;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class WikiCommentController extends Controller
{
    public function store(Request $request, Project $project, WikiPage $wikiPage, AddComment $action): RedirectResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:comments,id'],
        ]);

        $action->execute(
            commentable: $wikiPage,
            author: $request->user(),
            body: $validated['body'],
            parentId: $validated['parent_id'] ?? null,
        );

        return back();
    }
}
