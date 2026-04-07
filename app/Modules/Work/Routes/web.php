<?php

declare(strict_types=1);

use App\Modules\Work\Controllers\EpicAttachmentController;
use App\Modules\Work\Controllers\EpicCommentController;
use App\Modules\Work\Controllers\EpicController;
use App\Modules\Work\Controllers\TaskAttachmentController;
use App\Modules\Work\Controllers\TaskCommentController;
use App\Modules\Work\Controllers\TaskController;
use App\Modules\Work\Controllers\TaskDependencyController;
use App\Modules\Work\Controllers\TimeEntryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->scopeBindings()->group(function () {
    Route::resource('projects.epics', EpicController::class)->except(['create', 'edit']);

    Route::patch('projects/{project}/epics/{epic}/description', [EpicController::class, 'updatePartial'])->name('projects.epics.updatePartial');

    // Epic comments & attachments
    Route::post('projects/{project}/epics/{epic}/comments', [EpicCommentController::class, 'store'])->name('projects.epics.comments.store');
    Route::post('projects/{project}/epics/{epic}/attachments', [EpicAttachmentController::class, 'store'])->name('projects.epics.attachments.store');

    // Úkoly v rámci projektu (bez epiku)
    Route::get('projects/{project}/tasks', [TaskController::class, 'index'])->name('projects.tasks.index');
    Route::post('projects/{project}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store');

    // Úkoly v rámci epiku
    Route::get('projects/{project}/epics/{epic}/tasks', [TaskController::class, 'index'])->name('projects.epics.tasks.index');
    Route::post('projects/{project}/epics/{epic}/tasks', [TaskController::class, 'store'])->name('projects.epics.tasks.store');

    // Board a tabulka
    Route::get('projects/{project}/board', [TaskController::class, 'board'])->name('projects.tasks.board');
    Route::get('projects/{project}/table', [TaskController::class, 'table'])->name('projects.tasks.table');

    // Detail, update, delete úkolu
    Route::get('projects/{project}/tasks/{task}', [TaskController::class, 'show'])->name('projects.tasks.show');
    Route::put('projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('projects.tasks.update');
    Route::patch('projects/{project}/tasks/{task}', [TaskController::class, 'updatePartial'])->name('projects.tasks.updatePartial');
    Route::patch('projects/{project}/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('projects.tasks.updateStatus');
    Route::post('projects/{project}/tasks/bulk-status', [TaskController::class, 'bulkUpdateStatus'])->name('projects.tasks.bulkUpdateStatus');
    Route::patch('projects/{project}/tasks/{task}/recurrence', [TaskController::class, 'setRecurrence'])->name('projects.tasks.setRecurrence');
    Route::delete('projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('projects.tasks.destroy');
    Route::post('projects/{project}/tasks/{task}/duplicate', [TaskController::class, 'duplicate'])->name('projects.tasks.duplicate');

    // Task dependencies
    Route::post('projects/{project}/tasks/{task}/dependencies', [TaskDependencyController::class, 'store'])->name('projects.tasks.dependencies.store');
    Route::delete('projects/{project}/tasks/{task}/dependencies/{blocker}', [TaskDependencyController::class, 'destroy'])->name('projects.tasks.dependencies.destroy');

    // Task comments
    Route::post('projects/{project}/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('projects.tasks.comments.store');
    Route::put('comments/{comment}', [TaskCommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [TaskCommentController::class, 'destroy'])->name('comments.destroy');

    // Task attachments
    Route::post('projects/{project}/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])->name('projects.tasks.attachments.store');
    Route::get('attachments/{attachment}/download', [TaskAttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('attachments/{attachment}', [TaskAttachmentController::class, 'destroy'])->name('attachments.destroy');

    // Time entries
    Route::post('projects/{project}/time-entries', [TimeEntryController::class, 'store'])->name('projects.time-entries.store');
    Route::post('projects/{project}/epics/{epic}/time-entries', [TimeEntryController::class, 'storeForEpic'])->name('projects.epics.time-entries.store');
    Route::post('projects/{project}/tasks/{task}/time-entries', [TimeEntryController::class, 'store'])->name('projects.tasks.time-entries.store');
    Route::put('time-entries/{timeEntry}', [TimeEntryController::class, 'update'])->name('time-entries.update');
    Route::delete('time-entries/{timeEntry}', [TimeEntryController::class, 'destroy'])->name('time-entries.destroy');
});
