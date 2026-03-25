<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Notifications;

use App\Modules\Approvals\Models\ApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApprovalRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly ApprovalRequest $approvalRequest,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Nový approval request',
            'body' => "Čeká na vaše schválení: {$this->approvalRequest->description}",
            'approval_request_id' => $this->approvalRequest->id,
            'requester_name' => $this->approvalRequest->requester->name,
            'type' => 'approval_requested',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nový approval request čeká na vaše rozhodnutí')
            ->greeting('Dobrý den,')
            ->line("{$this->approvalRequest->requester->name} vás požádal/a o schválení.")
            ->line($this->approvalRequest->description ?? '')
            ->action('Zobrazit request', url('/'))
            ->salutation('PHC Nexus');
    }
}
