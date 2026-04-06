<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Projects\Export\TimeEntryExporter;
use App\Modules\Projects\Models\Project;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class TimeExportController extends Controller
{
    public function project(Request $request, Project $project, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);
        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');

        $format = $this->validFormat($request);
        $audit->log(AuditAction::Exported, $project, ['type' => "time_{$format}"]);

        $entries = $project->timeEntries()
            ->with(['user:id,name', 'task:id,title', 'epic:id,title'])
            ->latest('date')
            ->get();

        return $this->export($entries, $format, $project->key, $project->name);
    }

    public function epic(Request $request, Project $project, Epic $epic, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);
        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');

        $format = $this->validFormat($request);
        $audit->log(AuditAction::Exported, $epic, ['type' => "time_{$format}"]);

        $directEntries = $epic->timeEntries()
            ->with(['user:id,name', 'task:id,title', 'epic:id,title'])
            ->latest('date')
            ->get();

        $taskEntries = TimeEntry::whereIn('task_id', $epic->tasks()->pluck('id'))
            ->with(['user:id,name', 'task:id,title', 'epic:id,title'])
            ->latest('date')
            ->get();

        $entries = $directEntries->concat($taskEntries)->sortByDesc('date')->values();

        return $this->export($entries, $format, $project->key, "{$project->name} — {$epic->title}");
    }

    public function task(Request $request, Project $project, Task $task, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);
        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');

        $format = $this->validFormat($request);
        $audit->log(AuditAction::Exported, $task, ['type' => "time_{$format}"]);

        $entries = $task->timeEntries()
            ->with(['user:id,name', 'task:id,title', 'epic:id,title'])
            ->latest('date')
            ->get();

        return $this->export($entries, $format, $project->key, "{$project->name} — {$task->title}");
    }

    private function validFormat(Request $request): string
    {
        $format = $request->input('format', 'csv');
        abort_unless(in_array($format, ['csv', 'xml', 'md'], true), 422, 'Nepodporovaný formát.');

        return $format;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, TimeEntry>  $entries
     */
    private function export($entries, string $format, string $projectKey, string $contextName): StreamedResponse
    {
        $date = now()->format('Y-m-d');
        $ext = match ($format) {
            'xml' => 'xml',
            'md' => 'md',
            default => 'csv',
        };
        $filename = "{$projectKey}_time_{$date}.{$ext}";

        return match ($format) {
            'xml' => TimeEntryExporter::xml($entries, $filename),
            'md' => TimeEntryExporter::markdown($entries, $contextName, $filename),
            default => TimeEntryExporter::csv($entries, $filename),
        };
    }
}
