<?php

declare(strict_types=1);

use App\Modules\Projects\Controllers\BoardColumnController;
use App\Modules\Projects\Controllers\ProjectAttachmentController;
use App\Modules\Projects\Controllers\WorkflowController;
use App\Modules\Projects\Controllers\ProjectCommentController;
use App\Modules\Projects\Controllers\ProjectController;
use App\Modules\Projects\Controllers\ProjectExportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('projects', ProjectController::class);

    // Project exports
    Route::get('projects/{project}/export/tasks', [ProjectExportController::class, 'tasks'])->name('projects.export.tasks');
    Route::get('projects/{project}/export/summary', [ProjectExportController::class, 'project'])->name('projects.export.summary');

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

    // Board columns
    Route::post('projects/{project}/board-columns', [BoardColumnController::class, 'store'])->name('projects.board-columns.store');
    Route::put('projects/{project}/board-columns/{boardColumn}', [BoardColumnController::class, 'update'])->name('projects.board-columns.update');
    Route::delete('projects/{project}/board-columns/{boardColumn}', [BoardColumnController::class, 'destroy'])->name('projects.board-columns.destroy');
    Route::post('projects/{project}/board-columns/reorder', [BoardColumnController::class, 'reorder'])->name('projects.board-columns.reorder');
});
