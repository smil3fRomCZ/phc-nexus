<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Notifications;

use App\Modules\Projects\Models\WorkflowStatus;
use App\Modules\Work\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Task $task,
        public readonly WorkflowStatus $oldStatus,
        public readonly WorkflowStatus $newStatus,
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
            'title' => 'Status úkolu změněn',
            'body' => "{$this->task->title}: {$this->oldStatus->name} → {$this->newStatus->name}",
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'old_status' => $this->oldStatus->name,
            'new_status' => $this->newStatus->name,
            'type' => 'task_status_changed',
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Úkol {$this->task->title}: status změněn")
            ->greeting('Dobrý den,')
            ->line("Úkol \"{$this->task->title}\" změnil status z {$this->oldStatus->name} na {$this->newStatus->name}.")
            ->action('Zobrazit úkol', url('/'))
            ->salutation('PHC Nexus');
    }
}
