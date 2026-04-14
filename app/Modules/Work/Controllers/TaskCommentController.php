<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Comments\Actions\AddComment;
use App\Modules\Comments\Actions\EditComment;
use App\Modules\Comments\Models\Comment;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class TaskCommentController extends Controller
{
    public function store(Request $request, Project $project, Task $task, AddComment $action): RedirectResponse
    {
        Gate::authorize('view', $task);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'parent_id' => ['nullable', 'uuid', 'exists:comments,id'],
        ]);

        $action->execute(
            commentable: $task,
            author: $request->user(),
            body: $validated['body'],
            parentId: $validated['parent_id'] ?? null,
        );

        return back();
    }

    public function update(Request $request, Comment $comment, EditComment $action): RedirectResponse
    {
        Gate::authorize('update', $comment);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $action->execute($comment, $validated['body']);

        return back();
    }

    public function destroy(Request $request, Comment $comment): RedirectResponse
    {
        Gate::authorize('delete', $comment);

        $comment->delete();

        return back();
    }
}
