<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Projects\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class ProjectAttachmentController extends Controller
{
    public function store(Request $request, Project $project, UploadAttachment $action): RedirectResponse
    {
        Gate::authorize('update', $project);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $action->execute(
            file: $request->file('file'),
            attachable: $project,
            uploader: $request->user(),
        );

        return back();
    }
}
