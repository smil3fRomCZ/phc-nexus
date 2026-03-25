<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Actions;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalDecision;
use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Approvals\Models\ApprovalVote;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use Illuminate\Validation\ValidationException;

final class CastVote
{
    public function __construct(
        private readonly AuditService $auditService,
    ) {}

    public function execute(
        ApprovalRequest $request,
        User $voter,
        ApprovalDecision $decision,
        ?string $comment = null,
    ): ApprovalVote {
        if ($request->status->isResolved()) {
            throw ValidationException::withMessages([
                'status' => 'Tento approval request je již uzavřen.',
            ]);
        }

        if ($request->isExpired()) {
            throw ValidationException::withMessages([
                'status' => 'Tento approval request vypršel.',
            ]);
        }

        $vote = $request->votes()
            ->where('voter_id', $voter->id)
            ->firstOrFail();

        if ($vote->hasVoted()) {
            throw ValidationException::withMessages([
                'decision' => 'Již jste hlasoval/a.',
            ]);
        }

        $vote->update([
            'decision' => $decision,
            'comment' => $comment,
            'voted_at' => now(),
        ]);

        $auditAction = $decision === ApprovalDecision::Approved
            ? AuditAction::ApprovalApproved
            : AuditAction::ApprovalRejected;

        $this->auditService->log(
            action: $auditAction,
            entity: $request,
            payload: [
                'voter_id' => $voter->id,
                'decision' => $decision->value,
                'comment' => $comment,
            ],
        );

        $this->resolveRequest($request);

        return $vote->fresh();
    }

    /**
     * Režim all_approve / any reject:
     * - Jakýkoli reject → request zamítnut
     * - Všichni approved → request schválen
     */
    private function resolveRequest(ApprovalRequest $request): void
    {
        $request->refresh();
        $votes = $request->votes;

        // Jakýkoli reject okamžitě zamítne
        if ($votes->contains(fn (ApprovalVote $v) => $v->decision === ApprovalDecision::Rejected)) {
            $request->update([
                'status' => ApprovalStatus::Rejected,
                'decided_at' => now(),
            ]);

            return;
        }

        // Všichni schválili
        $allVoted = $votes->every(fn (ApprovalVote $v) => $v->hasVoted());
        $allApproved = $votes->every(fn (ApprovalVote $v) => $v->decision === ApprovalDecision::Approved);

        if ($allVoted && $allApproved) {
            $request->update([
                'status' => ApprovalStatus::Approved,
                'decided_at' => now(),
            ]);
        }
    }
}
