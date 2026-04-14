<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Notifications;

use App\Models\User;
use App\Modules\Approvals\Enums\ApprovalDecision;
use App\Modules\Approvals\Models\ApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalVoteCastNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ApprovalRequest $approvalRequest,
        public readonly User $voter,
        public readonly ApprovalDecision $decision,
    ) {
        $this->onQueue('notifications');
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Approval: {$this->decision->label()}",
            'body' => "{$this->voter->name} hlasoval/a: {$this->decision->label()}",
            'approval_request_id' => $this->approvalRequest->id,
            'voter_name' => $this->voter->name,
            'decision' => $this->decision->value,
            'type' => 'approval_vote_cast',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $this->decision->label();

        return (new MailMessage)
            ->subject("Approval vote: {$label}")
            ->greeting('Dobrý den,')
            ->line("{$this->voter->name} hlasoval/a: {$label}")
            ->line($this->approvalRequest->description ?? '')
            ->action('Zobrazit request', url('/'))
            ->salutation('PHC Nexus');
    }
}
