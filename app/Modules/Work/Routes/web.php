<?php

declare(strict_types=1);

use App\Modules\Work\Controllers\EpicController;
use App\Modules\Work\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('projects.epics', EpicController::class)->except(['create', 'edit']);

    // Úkoly v rámci projektu (bez epiku)
    Route::get('projects/{project}/tasks', [TaskController::class, 'index'])->name('projects.tasks.index');
    Route::post('projects/{project}/tasks', [TaskController::class, 'store'])->name('projects.tasks.store');

    // Úkoly v rámci epiku
    Route::get('projects/{project}/epics/{epic}/tasks', [TaskController::class, 'index'])->name('projects.epics.tasks.index');
    Route::post('projects/{project}/epics/{epic}/tasks', [TaskController::class, 'store'])->name('projects.epics.tasks.store');

    // Detail, update, delete úkolu
    Route::get('projects/{project}/tasks/{task}', [TaskController::class, 'show'])->name('projects.tasks.show');
    Route::put('projects/{project}/tasks/{task}', [TaskController::class, 'update'])->name('projects.tasks.update');
    Route::delete('projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])->name('projects.tasks.destroy');
});
