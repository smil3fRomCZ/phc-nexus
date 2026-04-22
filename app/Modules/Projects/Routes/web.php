<?php

declare(strict_types=1);

use App\Modules\Projects\Controllers\ProjectAttachmentController;
use App\Modules\Projects\Controllers\ProjectCommentController;
use App\Modules\Projects\Controllers\ProjectController;
use App\Modules\Projects\Controllers\ProjectExportController;
use App\Modules\Projects\Controllers\ProjectHistoryController;
use App\Modules\Projects\Controllers\ProjectMemberController;
use App\Modules\Projects\Controllers\ProjectTabConfigController;
use App\Modules\Projects\Controllers\ReportController;
use App\Modules\Projects\Controllers\TimeExportController;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Controllers\WorkflowTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('projects', ProjectController::class);

    // Project time, gantt & reports
    Route::get('projects/{project}/time', [ProjectController::class, 'time'])->name('projects.time');
    Route::get('projects/{project}/gantt', [ProjectController::class, 'gantt'])->name('projects.gantt');
    Route::get('projects/{project}/reports', [ReportController::class, 'index'])->name('projects.reports');
    Route::get('projects/{project}/history', [ProjectHistoryController::class, 'index'])->name('projects.history');

    // Tab configuration (custom order per project)
    Route::put('projects/{project}/tab-config', [ProjectTabConfigController::class, 'update'])->name('projects.tab-config.update');
    Route::delete('projects/{project}/tab-config', [ProjectTabConfigController::class, 'destroy'])->name('projects.tab-config.destroy');

    // Project updates
    Route::post('projects/{project}/updates', [ProjectController::class, 'storeUpdate'])->name('projects.updates.store');

    // PHI reclassification (dedikovaný endpoint, Executive only, vyžaduje reason)
    Route::patch('projects/{project}/classification', [ProjectController::class, 'reclassify'])->name('projects.reclassify');

    // Project exports
    Route::get('projects/{project}/export/tasks', [ProjectExportController::class, 'tasks'])->name('projects.export.tasks');
    Route::get('projects/{project}/export/summary', [ProjectExportController::class, 'project'])->name('projects.export.summary');
    Route::get('projects/{project}/export/time', [TimeExportController::class, 'project'])->name('projects.export.time');
    Route::get('projects/{project}/epics/{epic}/export/time', [TimeExportController::class, 'epic'])->name('projects.epics.export.time');
    Route::get('projects/{project}/tasks/{task}/export/time', [TimeExportController::class, 'task'])->name('projects.tasks.export.time');

    // Project members
    Route::get('projects/{project}/members', [ProjectMemberController::class, 'index'])->name('projects.members.index');
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
    Route::get('projects/{project}/members/{user}/usage', [ProjectMemberController::class, 'usage'])->name('projects.members.usage');
    Route::patch('projects/{project}/members/{user}', [ProjectMemberController::class, 'updateRole'])->name('projects.members.updateRole');
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy');

    // Project comments & attachments
    Route::post('projects/{project}/comments', [ProjectCommentController::class, 'store'])->name('projects.comments.store');
    Route::post('projects/{project}/attachments', [ProjectAttachmentController::class, 'store'])->name('projects.attachments.store');

    // Workflow
    Route::get('projects/{project}/workflow', [WorkflowController::class, 'index'])->name('projects.workflow.index');
    Route::post('projects/{project}/workflow/statuses', [WorkflowController::class, 'storeStatus'])->name('projects.workflow.statuses.store');
    Route::put('projects/{project}/workflow/statuses/{workflowStatus}', [WorkflowController::class, 'updateStatus'])->name('projects.workflow.statuses.update');
    Route::delete('projects/{project}/workflow/statuses/{workflowStatus}', [WorkflowController::class, 'destroyStatus'])->name('projects.workflow.statuses.destroy');
    Route::post('projects/{project}/workflow/transitions', [WorkflowController::class, 'storeTransition'])->name('projects.workflow.transitions.store');
    Route::delete('projects/{project}/workflow/transitions/{workflowTransition}', [WorkflowController::class, 'destroyTransition'])->name('projects.workflow.transitions.destroy');

    // Workflow Templates
    Route::get('workflow-templates', [WorkflowTemplateController::class, 'index'])->name('workflow-templates.index');
    Route::post('workflow-templates', [WorkflowTemplateController::class, 'store'])->name('workflow-templates.store');
    Route::get('workflow-templates/{template}', [WorkflowTemplateController::class, 'show'])->name('workflow-templates.show');
    Route::delete('workflow-templates/{template}', [WorkflowTemplateController::class, 'destroy'])->name('workflow-templates.destroy');
    Route::post('workflow-templates/{template}/statuses', [WorkflowTemplateController::class, 'addStatus'])->name('workflow-templates.statuses.store');
    Route::put('workflow-templates/{template}/statuses/{status}', [WorkflowTemplateController::class, 'updateStatus'])->name('workflow-templates.statuses.update');
    Route::delete('workflow-templates/{template}/statuses/{status}', [WorkflowTemplateController::class, 'deleteStatus'])->name('workflow-templates.statuses.destroy');
    Route::post('workflow-templates/{template}/transitions', [WorkflowTemplateController::class, 'addTransition'])->name('workflow-templates.transitions.store');
    Route::delete('workflow-templates/{template}/transitions/{transition}', [WorkflowTemplateController::class, 'deleteTransition'])->name('workflow-templates.transitions.destroy');
    Route::post('workflow-templates/{template}/apply/{project}', [WorkflowTemplateController::class, 'applyToProject'])->name('workflow-templates.apply');

});
