<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Actions;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalMode;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Notifications\Notifications\ApprovalRequestedNotification;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Notification;

final class RequestApproval
{
    /**
     * @param  array<string>  $approverIds  UUIDs of required approvers
     */
    public function execute(
        Model $approvable,
        User $requester,
        array $approverIds,
        ?string $description = null,
        ?Carbon $expiresAt = null,
    ): ApprovalRequest {
        $request = ApprovalRequest::create([
            'approvable_type' => $approvable->getMorphClass(),
            'approvable_id' => $approvable->getKey(),
            'requester_id' => $requester->id,
            'mode' => ApprovalMode::AllApprove,
            'description' => $description,
            'expires_at' => $expiresAt,
        ]);

        foreach ($approverIds as $approverId) {
            $request->votes()->create([
                'voter_id' => $approverId,
            ]);
        }

        $request->load('votes.voter:id,name');

        // Notifikovat approvers
        $approvers = User::whereIn('id', $approverIds)->get();
        Notification::send($approvers, new ApprovalRequestedNotification($request));

        return $request;
    }
}
