<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Actions\DownloadAttachment;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Files\Models\Attachment;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TaskAttachmentController extends Controller
{
    public function store(Request $request, Project $project, Task $task, UploadAttachment $action): RedirectResponse
    {
        Gate::authorize('update', $task);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'], // 20 MB
        ]);

        $action->execute(
            file: $request->file('file'),
            attachable: $task,
            uploader: $request->user(),
        );

        return back();
    }

    public function download(Attachment $attachment, DownloadAttachment $action, Request $request): StreamedResponse
    {
        return $action->execute($attachment, $request->user());
    }

    public function destroy(Request $request, Attachment $attachment): RedirectResponse
    {
        $attachable = $attachment->attachable;
        Gate::authorize('update', $attachable);

        $attachment->deleteFile();
        $attachment->delete();

        return back();
    }
}
