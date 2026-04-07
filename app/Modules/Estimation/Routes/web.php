<?php

declare(strict_types=1);

use App\Modules\Estimation\Controllers\EstimationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->scopeBindings()->group(function () {
    Route::get('projects/{project}/estimation', [EstimationController::class, 'index'])->name('projects.estimation.index');
    Route::post('projects/{project}/estimation', [EstimationController::class, 'store'])->name('projects.estimation.store');
    Route::get('projects/{project}/estimation/{session}', [EstimationController::class, 'show'])->name('projects.estimation.show');

    Route::post('projects/{project}/estimation/{session}/rounds/{round}/vote', [EstimationController::class, 'vote'])->name('projects.estimation.vote');
    Route::post('projects/{project}/estimation/{session}/rounds/{round}/reveal', [EstimationController::class, 'reveal'])->name('projects.estimation.reveal');
    Route::post('projects/{project}/estimation/{session}/rounds/{round}/confirm', [EstimationController::class, 'confirm'])->name('projects.estimation.confirm');
    Route::post('projects/{project}/estimation/{session}/rounds/{round}/revote', [EstimationController::class, 'revote'])->name('projects.estimation.revote');

    Route::post('projects/{project}/estimation/{session}/complete', [EstimationController::class, 'complete'])->name('projects.estimation.complete');
});
