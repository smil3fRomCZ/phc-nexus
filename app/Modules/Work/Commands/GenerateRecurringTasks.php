<?php

declare(strict_types=1);

namespace App\Modules\Work\Commands;

use App\Modules\Work\Enums\RecurrenceRule;
use App\Modules\Work\Models\Task;
use Illuminate\Console\Command;

final class GenerateRecurringTasks extends Command
{
    protected $signature = 'tasks:generate-recurring';

    protected $description = 'Generuje nové instance recurring tasks pokud nastalo recurrence_next_at';

    public function handle(): int
    {
        $tasks = Task::query()
            ->whereNotNull('recurrence_rule')
            ->whereNotNull('recurrence_next_at')
            ->where('recurrence_next_at', '<=', now()->toDateString())
            ->get();

        $count = 0;

        foreach ($tasks as $task) {
            /** @var RecurrenceRule $rule */
            $rule = $task->recurrence_rule;

            // Najít initial workflow status pro projekt
            $initialStatus = $task->project->workflowStatuses()->where('is_initial', true)->first();

            $newTask = Task::create([
                'project_id' => $task->project_id,
                'epic_id' => $task->epic_id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => 'backlog',
                'workflow_status_id' => $initialStatus?->id ?? $task->workflow_status_id,
                'priority' => is_object($task->priority) ? $task->priority->value : (string) $task->priority,
                'data_classification' => $task->getRawOriginal('data_classification'),
                'assignee_id' => $task->assignee_id,
                'reporter_id' => $task->reporter_id,
                'due_date' => $task->recurrence_next_at,
                'recurrence_source_id' => $task->recurrence_source_id ?? $task->id,
            ]);

            /** @var \DateTimeInterface $recurrenceDate */
            $recurrenceDate = $task->recurrence_next_at;
            $nextDate = $rule->nextDate($recurrenceDate);
            $task->update(['recurrence_next_at' => $nextDate->format('Y-m-d')]);

            $count++;
        }

        $this->info("Vygenerováno {$count} recurring tasks.");

        return self::SUCCESS;
    }
}
