<?php

declare(strict_types=1);

namespace App\Modules\Wiki\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Projects\Models\Project;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class WikiAttachmentController extends Controller
{
    public function store(Request $request, Project $project, WikiPage $wikiPage, UploadAttachment $action): RedirectResponse
    {
        Gate::authorize('view', $project);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $action->execute(
            file: $request->file('file'),
            attachable: $wikiPage,
            uploader: $request->user(),
        );

        return back();
    }

    public function storeImage(Request $request, Project $project, WikiPage $wikiPage, UploadAttachment $action): JsonResponse
    {
        Gate::authorize('view', $project);

        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp,svg', 'max:10240'],
        ]);

        $attachment = $action->execute(
            file: $request->file('file'),
            attachable: $wikiPage,
            uploader: $request->user(),
        );

        return response()->json([
            'url' => route('attachments.download', $attachment),
        ]);
    }
}
