<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\BoardColumn;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Enums\TaskStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BoardColumnController extends Controller
{
    public function store(Request $request, Project $project): JsonResponse
    {
        $this->authorizeManage($request, $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'status_key' => ['required', 'string', 'in:'.implode(',', array_column(TaskStatus::cases(), 'value'))],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $maxPosition = $project->boardColumns()->max('position') ?? -1;

        $column = $project->boardColumns()->create([
            ...$validated,
            'position' => $maxPosition + 1,
        ]);

        return response()->json($column, 201);
    }

    public function update(Request $request, Project $project, BoardColumn $boardColumn): JsonResponse
    {
        $this->authorizeManage($request, $project);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:7'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);

        $boardColumn->update($validated);

        return response()->json($boardColumn);
    }

    public function destroy(Request $request, Project $project, BoardColumn $boardColumn): JsonResponse
    {
        $this->authorizeManage($request, $project);

        // Přesun úkolů do předchozího sloupce
        $previousColumn = $project->boardColumns()
            ->where('position', '<', $boardColumn->position)
            ->orderByDesc('position')
            ->first();

        if ($previousColumn) {
            $project->tasks()
                ->where('status', $boardColumn->status_key)
                ->update(['status' => $previousColumn->status_key]);
        }

        $boardColumn->delete();

        return response()->json(['success' => true]);
    }

    public function reorder(Request $request, Project $project): JsonResponse
    {
        $this->authorizeManage($request, $project);

        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['uuid'],
        ]);

        foreach ($validated['order'] as $position => $id) {
            BoardColumn::where('id', $id)
                ->where('project_id', $project->id)
                ->update(['position' => $position]);
        }

        return response()->json(['success' => true]);
    }

    private function authorizeManage(Request $request, Project $project): void
    {
        $user = $request->user();
        $isOwner = $project->owner_id === $user->id;
        $isPm = $project->epics()->where('pm_id', $user->id)->exists();

        if (! $isOwner && ! $isPm) {
            abort(403, 'Pouze vlastník projektu nebo PM může spravovat sloupce.');
        }
    }
}
