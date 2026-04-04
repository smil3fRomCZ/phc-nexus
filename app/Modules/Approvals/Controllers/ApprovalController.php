<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Approvals\Actions\CastVote;
use App\Modules\Approvals\Actions\RequestApproval;
use App\Modules\Approvals\Enums\ApprovalDecision;
use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ApprovalController extends Controller
{
    public function index(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $query = ApprovalRequest::where('approvable_type', Task::class)
            ->whereIn('approvable_id', $project->tasks()->select('id'))
            ->with(['requester:id,name', 'votes.voter:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDir = $request->input('dir', 'desc');
        $allowedSorts = ['status', 'created_at', 'expires_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $requests = $query->get();

        return Inertia::render('Approvals/Index', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'approvalRequests' => $requests,
            'filters' => $request->only(['status', 'sort', 'dir']),
        ]);
    }

    public function show(Project $project, ApprovalRequest $approval): Response
    {
        Gate::authorize('view', $approval);

        $approval->load([
            'requester:id,name',
            'votes.voter:id,name',
            'approvable',
        ]);

        return Inertia::render('Approvals/Show', [
            'project' => $project->only('id', 'name', 'key', 'status'),
            'approvalRequest' => $approval,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('view', $project);
        Gate::authorize('create', ApprovalRequest::class);

        $validated = $request->validate([
            'task_id' => ['required', 'uuid', 'exists:tasks,id'],
            'approver_ids' => ['required', 'array', 'min:1'],
            'approver_ids.*' => ['uuid', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $task = Task::where('id', $validated['task_id'])
            ->where('project_id', $project->id)
            ->firstOrFail();

        $action = app(RequestApproval::class);
        $action->execute(
            approvable: $task,
            requester: $request->user(),
            approverIds: $validated['approver_ids'],
            description: $validated['description'] ?? null,
            expiresAt: isset($validated['expires_at']) ? Carbon::parse($validated['expires_at']) : null,
        );

        return back()->with('success', 'Approval request vytvořen.');
    }

    public function vote(Request $request, Project $project, ApprovalRequest $approval): RedirectResponse
    {
        Gate::authorize('vote', $approval);

        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:approved,rejected'],
            'comment' => ['nullable', 'string'],
        ]);

        $action = app(CastVote::class);
        $action->execute(
            request: $approval,
            voter: $request->user(),
            decision: ApprovalDecision::from($validated['decision']),
            comment: $validated['comment'] ?? null,
        );

        return back()->with('success', 'Hlas zaznamenán.');
    }

    public function cancel(Request $request, Project $project, ApprovalRequest $approval): RedirectResponse
    {
        Gate::authorize('cancel', $approval);

        $approval->update([
            'status' => ApprovalStatus::Cancelled,
            'decided_at' => now(),
        ]);

        return back()->with('success', 'Approval request zrušen.');
    }
}
