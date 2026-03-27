<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Files\Actions\UploadAttachment;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class EpicAttachmentController extends Controller
{
    public function store(Request $request, Project $project, Epic $epic, UploadAttachment $action): RedirectResponse
    {
        Gate::authorize('update', $epic);

        $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $action->execute(
            file: $request->file('file'),
            attachable: $epic,
            uploader: $request->user(),
        );

        return back();
    }
}
