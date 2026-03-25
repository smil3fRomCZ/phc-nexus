<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Jobs;

use App\Modules\Approvals\Enums\ApprovalStatus;
use App\Modules\Approvals\Models\ApprovalRequest;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ApprovalReminderJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $pending = ApprovalRequest::where('status', ApprovalStatus::Pending)
            ->where('created_at', '<=', now()->subDay())
            ->with(['pendingVotes.voter:id,name,email', 'requester:id,name'])
            ->get();

        foreach ($pending as $request) {
            // Expirované requesty automaticky zrušit
            if ($request->isExpired()) {
                $request->update([
                    'status' => ApprovalStatus::Cancelled,
                    'decided_at' => now(),
                ]);
                Log::info('Approval request expired', ['id' => $request->id]);

                continue;
            }

            // Logovat pending reminders (notifikace přijdou v notification PR)
            foreach ($request->pendingVotes as $vote) {
                Log::info('Approval reminder pending', [
                    'request_id' => $request->id,
                    'voter_id' => $vote->voter_id,
                    'voter_name' => $vote->voter->name,
                    'created_at' => $request->created_at->toISOString(),
                ]);
            }
        }
    }
}
