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
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
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

        /** @var EloquentCollection<int, TimeEntry> $entries */
        $entries = $this->filterNonPhiEntries(
            $project->timeEntries()
                ->with(['user:id,name', 'task:id,title,data_classification', 'epic:id,title,data_classification'])
                ->latest('date')
                ->get()
        );

        $audit->log(AuditAction::Exported, $project, [
            'type' => "time_{$format}",
            'rows' => $entries->count(),
            'phi_filter' => 'non_phi_only',
        ]);

        return $this->export($entries, $format, $project->key, $project->name);
    }

    public function epic(Request $request, Project $project, Epic $epic, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);
        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');
        // Block export pokud samotný epic je PHI-restricted (i kdyby project nebyl).
        abort_unless($phiGuard->canExport($request->user(), $epic), 403, 'Export PHI dat není povolen.');

        $format = $this->validFormat($request);

        /** @var EloquentCollection<int, TimeEntry> $directEntries */
        $directEntries = $epic->timeEntries()
            ->with(['user:id,name', 'task:id,title,data_classification', 'epic:id,title,data_classification'])
            ->latest('date')
            ->get();

        /** @var EloquentCollection<int, TimeEntry> $taskEntries */
        $taskEntries = TimeEntry::whereIn('task_id', $epic->tasks()->pluck('id'))
            ->with(['user:id,name', 'task:id,title,data_classification', 'epic:id,title,data_classification'])
            ->latest('date')
            ->get();

        /** @var EloquentCollection<int, TimeEntry> $entries */
        $entries = $this->filterNonPhiEntries(new EloquentCollection(
            $directEntries->concat($taskEntries)->sortByDesc('date')->values()->all()
        ));

        $audit->log(AuditAction::Exported, $epic, [
            'type' => "time_{$format}",
            'rows' => $entries->count(),
            'phi_filter' => 'non_phi_only',
        ]);

        return $this->export($entries, $format, $project->key, "{$project->name} — {$epic->title}");
    }

    public function task(Request $request, Project $project, Task $task, PhiAccessGuard $phiGuard, AuditService $audit): StreamedResponse
    {
        Gate::authorize('view', $project);
        abort_unless($phiGuard->canExport($request->user(), $project), 403, 'Export PHI dat není povolen.');
        // Task-level PHI check: block pokud je task PHI-restricted.
        abort_unless($phiGuard->canExport($request->user(), $task), 403, 'Export PHI dat není povolen.');

        $format = $this->validFormat($request);

        /** @var EloquentCollection<int, TimeEntry> $entries */
        $entries = $task->timeEntries()
            ->with(['user:id,name', 'task:id,title,data_classification', 'epic:id,title,data_classification'])
            ->latest('date')
            ->get();

        $audit->log(AuditAction::Exported, $task, [
            'type' => "time_{$format}",
            'rows' => $entries->count(),
        ]);

        return $this->export($entries, $format, $project->key, "{$project->name} — {$task->title}");
    }

    /**
     * Odfiltruje time entries, kde je přiřazený task nebo epic označen jako PHI.
     *
     * @param  EloquentCollection<int, TimeEntry>  $entries
     * @return EloquentCollection<int, TimeEntry>
     */
    private function filterNonPhiEntries(EloquentCollection $entries): EloquentCollection
    {
        /** @var EloquentCollection<int, TimeEntry> $filtered */
        $filtered = $entries->filter(function (TimeEntry $entry): bool {
            // isPhiRestricted() zahrnuje Unknown = PHI strictness politiku.
            if ($entry->task && $entry->task->isPhiRestricted()) {
                return false;
            }

            return ! $entry->epic || ! $entry->epic->isPhiRestricted();
        })->values();

        return $filtered;
    }

    private function validFormat(Request $request): string
    {
        $format = $request->input('format', 'csv');
        abort_unless(in_array($format, ['csv', 'xml', 'md'], true), 422, 'Nepodporovaný formát.');

        return $format;
    }

    /**
     * @param  EloquentCollection<int, TimeEntry>  $entries
     */
    private function export(EloquentCollection $entries, string $format, string $projectKey, string $contextName): StreamedResponse
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
