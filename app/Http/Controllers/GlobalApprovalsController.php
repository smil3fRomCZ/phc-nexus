<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class GlobalApprovalsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $approvals = ApprovalRequest::query()
            ->with(['requester:id,name', 'votes.voter:id,name', 'approvable'])
            ->where('status', 'pending')
            ->whereHas('votes', function ($q) use ($user) {
                $q->where('voter_id', $user->id)->whereNull('decision');
            })
            ->latest()
            ->get()
            ->map(function (ApprovalRequest $approval): array {
                $approvable = $approval->approvable;
                $projectId = match (true) {
                    $approvable instanceof Task => $approvable->project_id,
                    $approvable instanceof Project => $approvable->id,
                    default => null,
                };

                return [
                    'id' => $approval->id,
                    'description' => $approval->description,
                    'status' => $approval->status,
                    'mode' => $approval->mode,
                    'requester' => $approval->requester,
                    'votes' => $approval->votes,
                    'created_at' => $approval->created_at,
                    'expires_at' => $approval->expires_at,
                    'project_id' => $projectId,
                    'approvable_title' => $approvable instanceof Task
                        ? $approvable->title
                        : null,
                ];
            });

        return Inertia::render('Approvals/Global', [
            'approvals' => $approvals,
        ]);
    }
}
