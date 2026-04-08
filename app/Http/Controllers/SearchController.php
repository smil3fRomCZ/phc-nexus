<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Audit\Enums\PhiClassification;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SearchController extends Controller
{
    public function __invoke(Request $request, PhiAccessGuard $phiGuard): JsonResponse
    {
        $query = trim((string) $request->input('q'));

        if (mb_strlen($query) < 2) {
            return response()->json(['projects' => [], 'tasks' => []]);
        }

        $user = $request->user();
        $like = '%'.$query.'%';
        $hasPhiClearance = $phiGuard->userHasPhiClearance($user);

        /** @var SystemRole $role */
        $role = $user->system_role;
        $isTeamMember = $role->value === 'team_member';

        $projects = Project::query()
            ->where(function ($q) use ($like) {
                $q->where('name', 'ilike', $like)
                    ->orWhere('key', 'ilike', $like);
            })
            ->when($isTeamMember, function ($q) use ($user) {
                $q->where(function ($sub) use ($user) {
                    $sub->where('owner_id', $user->id)
                        ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
                });
            })
            ->when(! $hasPhiClearance, fn ($q) => $q->where('data_classification', PhiClassification::NonPhi->value))
            ->limit(5)
            ->get(['id', 'name', 'key', 'status']);

        $tasks = Task::query()
            ->with(['project:id,name,key', 'workflowStatus:id,name,color'])
            ->where('title', 'ilike', $like)
            ->whereHas('project', function ($q) use ($user, $isTeamMember, $hasPhiClearance) {
                $q->when($isTeamMember, function ($sub) use ($user) {
                    $sub->where('owner_id', $user->id)
                        ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
                });
                $q->when(! $hasPhiClearance, fn ($sub) => $sub->where('data_classification', PhiClassification::NonPhi->value));
            })
            ->limit(5)
            ->get(['id', 'title', 'project_id', 'workflow_status_id']);

        return response()->json([
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }
}
