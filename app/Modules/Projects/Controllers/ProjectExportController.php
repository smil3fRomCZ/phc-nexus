<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ProjectExportController extends Controller
{
    public function tasks(Request $request, Project $project, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);

        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');

        $audit->log(AuditAction::Exported, $project, ['type' => 'tasks_csv']);

        $tasks = Task::query()
            ->where('project_id', $project->id)
            ->where('data_classification', 'non_phi')
            ->with(['assignee:id,name', 'reporter:id,name', 'epic:id,title'])
            ->orderBy('created_at')
            ->get();

        $filename = "{$project->key}_tasks_".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($tasks) {
            $out = fopen('php://output', 'w');
            assert($out !== false);

            fputcsv($out, ['Title', 'Status', 'Priority', 'Assignee', 'Reporter', 'Epic', 'Due Date', 'Created']);

            foreach ($tasks as $task) {
                /** @var Task $task */
                fputcsv($out, [
                    $task->title,
                    is_object($task->status) ? $task->status->value : (string) $task->status,
                    is_object($task->priority) ? $task->priority->value : (string) $task->priority,
                    $task->assignee->name ?? '',
                    $task->reporter->name ?? '',
                    $task->epic->title ?? '',
                    $task->due_date instanceof \DateTimeInterface ? $task->due_date->format('Y-m-d') : '',
                    $task->created_at->format('Y-m-d H:i'),
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function project(Request $request, Project $project, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);

        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');

        $audit->log(AuditAction::Exported, $project, ['type' => 'project_csv']);

        $project->load(['owner:id,name', 'team:id,name', 'members:id,name']);
        $project->loadCount(['tasks', 'epics']);

        $filename = "{$project->key}_summary_".now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($project) {
            $out = fopen('php://output', 'w');
            assert($out !== false);

            /** @var string $statusValue */
            $statusValue = is_object($project->status) ? $project->status->value : (string) $project->status;

            fputcsv($out, ['Field', 'Value']);
            fputcsv($out, ['Name', $project->name]);
            fputcsv($out, ['Key', $project->key]);
            fputcsv($out, ['Status', $statusValue]);
            fputcsv($out, ['Description', $project->description ?? '']);
            fputcsv($out, ['Owner', $project->owner->name ?? '']);
            fputcsv($out, ['Team', $project->team->name ?? '']);
            fputcsv($out, ['Start Date', $project->start_date instanceof \DateTimeInterface ? $project->start_date->format('Y-m-d') : '']);
            fputcsv($out, ['Target Date', $project->target_date instanceof \DateTimeInterface ? $project->target_date->format('Y-m-d') : '']);
            fputcsv($out, ['Tasks Count', (string) $project->tasks_count]);
            fputcsv($out, ['Epics Count', (string) $project->epics_count]);
            fputcsv($out, ['Members', $project->members->pluck('name')->implode(', ')]);

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
