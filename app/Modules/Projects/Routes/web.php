<?php

declare(strict_types=1);

use App\Modules\Projects\Controllers\BoardColumnController;
use App\Modules\Projects\Controllers\ProjectAttachmentController;
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

    // Board columns
    Route::post('projects/{project}/board-columns', [BoardColumnController::class, 'store'])->name('projects.board-columns.store');
    Route::put('projects/{project}/board-columns/{boardColumn}', [BoardColumnController::class, 'update'])->name('projects.board-columns.update');
    Route::delete('projects/{project}/board-columns/{boardColumn}', [BoardColumnController::class, 'destroy'])->name('projects.board-columns.destroy');
    Route::post('projects/{project}/board-columns/reorder', [BoardColumnController::class, 'reorder'])->name('projects.board-columns.reorder');
});
