<?php

declare(strict_types=1);

use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Models\Project;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Pro každý projekt bez workflow statuses vytvořit default set
        $projectsWithoutWorkflow = Project::whereDoesntHave('workflowStatuses')->get();
        foreach ($projectsWithoutWorkflow as $project) {
            WorkflowController::seedDefaultWorkflow($project);
        }

        // 2. Namapovat tasks.status enum na workflow_status_id podle slug shody
        $projects = Project::with('workflowStatuses')->get();
        foreach ($projects as $project) {
            $slugMap = $project->workflowStatuses->pluck('id', 'slug');

            // Enum slug mapping (TaskStatus enum values → workflow_statuses slugs)
            $enumToSlug = [
                'backlog' => 'backlog',
                'todo' => 'todo',
                'in_progress' => 'in_progress',
                'in_review' => 'in_review',
                'done' => 'done',
                'cancelled' => 'cancelled',
            ];

            foreach ($enumToSlug as $enumValue => $slug) {
                // Zkusit přesný slug, pak variantu s pomlčkou
                $workflowStatusId = $slugMap[$slug] ?? $slugMap[str_replace('_', '-', $slug)] ?? null;

                if ($workflowStatusId) {
                    DB::table('tasks')
                        ->where('project_id', $project->id)
                        ->where('status', $enumValue)
                        ->whereNull('workflow_status_id')
                        ->update(['workflow_status_id' => $workflowStatusId]);
                }
            }

            // Fallback: tasky bez workflow_status_id dostanou initial nebo první status
            $fallbackStatus = $project->workflowStatuses->firstWhere('is_initial', true)
                ?? $project->workflowStatuses->sortBy('position')->first();
            if ($fallbackStatus) {
                DB::table('tasks')
                    ->where('project_id', $project->id)
                    ->whereNull('workflow_status_id')
                    ->update(['workflow_status_id' => $fallbackStatus->id]);
            }
        }

        // 3. Finální fallback: jakýkoliv task bez workflow_status_id
        $orphanedTasks = DB::table('tasks')->whereNull('workflow_status_id')->get(['id', 'project_id']);
        foreach ($orphanedTasks as $task) {
            $fallbackId = DB::table('workflow_statuses')
                ->where('project_id', $task->project_id)
                ->where('is_initial', true)
                ->value('id')
                ?? DB::table('workflow_statuses')
                    ->where('project_id', $task->project_id)
                    ->orderBy('position')
                    ->value('id');

            if ($fallbackId) {
                DB::table('tasks')->where('id', $task->id)->update(['workflow_status_id' => $fallbackId]);
            }
        }

        // 4. Nastavit workflow_status_id jako NOT NULL
        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('workflow_status_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('workflow_status_id')->nullable()->change();
        });
    }
};
