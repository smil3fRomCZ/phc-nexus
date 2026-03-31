<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class TimeEntryController extends Controller
{
    public function store(Request $request, Project $project, ?Task $task = null): JsonResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        TimeEntry::create([
            ...$validated,
            'project_id' => $project->id,
            'task_id' => $task?->id,
            'epic_id' => $task?->epic_id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, TimeEntry $timeEntry): JsonResponse
    {
        if ($timeEntry->user_id !== $request->user()->id) {
            abort(403);
        }

        $timeEntry->delete();

        return response()->json(['success' => true]);
    }
}
