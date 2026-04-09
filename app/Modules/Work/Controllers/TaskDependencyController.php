<?php

declare(strict_types=1);

namespace App\Modules\Work\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class TaskDependencyController extends Controller
{
    public function store(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'blocker_id' => ['required', 'uuid', 'exists:tasks,id'],
        ]);

        abort_if($validated['blocker_id'] === $task->id, 422, 'Úkol nemůže blokovat sám sebe.');

        $task->blockers()->syncWithoutDetaching([$validated['blocker_id']]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, Project $project, Task $task, Task $blocker): JsonResponse
    {
        Gate::authorize('update', $task);

        $task->blockers()->detach($blocker->id);

        return response()->json(['success' => true]);
    }

    public function storeBlocking(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('update', $task);

        $validated = $request->validate([
            'blocked_id' => ['required', 'uuid', 'exists:tasks,id'],
        ]);

        abort_if($validated['blocked_id'] === $task->id, 422, 'Úkol nemůže blokovat sám sebe.');

        $task->blocking()->syncWithoutDetaching([$validated['blocked_id']]);

        return response()->json(['success' => true]);
    }

    public function destroyBlocking(Request $request, Project $project, Task $task, Task $blocked): JsonResponse
    {
        Gate::authorize('update', $task);

        $task->blocking()->detach($blocked->id);

        return response()->json(['success' => true]);
    }
}
