<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Notifications;

use App\Models\User;
use App\Modules\Work\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Task $task,
        public readonly User $assignedBy,
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
            'title' => 'Nový úkol přiřazen',
            'body' => "{$this->assignedBy->name} vám přiřadil/a úkol: {$this->task->title}",
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'assigned_by_name' => $this->assignedBy->name,
            'type' => 'task_assigned',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Nový úkol: {$this->task->title}")
            ->greeting('Dobrý den,')
            ->line("{$this->assignedBy->name} vám přiřadil/a úkol: {$this->task->title}")
            ->action('Zobrazit úkol', url('/'))
            ->salutation('PHC Nexus');
    }
}
