<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class TimeEntryController extends Controller
{
    public function store(Request $request, Project $project, ?Task $task = null): RedirectResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'note' => ['nullable', 'string', 'max:500'],
            'task_id' => ['nullable', 'uuid', 'exists:tasks,id'],
        ]);

        $resolvedTaskId = $task !== null ? $task->id : ($validated['task_id'] ?? null);
        $resolvedTask = $resolvedTaskId ? Task::find($resolvedTaskId) : null;

        TimeEntry::create([
            'date' => $validated['date'],
            'hours' => $validated['hours'],
            'note' => $validated['note'] ?? null,
            'project_id' => $project->id,
            'task_id' => $resolvedTaskId,
            'epic_id' => $resolvedTask?->epic_id,
            'user_id' => $request->user()->id,
        ]);

        return back();
    }

    public function storeForEpic(Request $request, Project $project, Epic $epic): RedirectResponse
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
            'epic_id' => $epic->id,
            'task_id' => null,
            'user_id' => $request->user()->id,
        ]);

        return back();
    }

    public function update(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('update', $timeEntry);

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $timeEntry->update($validated);

        return back();
    }

    public function destroy(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('delete', $timeEntry);

        $timeEntry->delete();

        return back();
    }
}
