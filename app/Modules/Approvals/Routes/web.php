<?php

declare(strict_types=1);

use App\Modules\Approvals\Controllers\ApprovalController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('projects/{project}/approvals', [ApprovalController::class, 'index'])->name('projects.approvals.index');
    Route::post('projects/{project}/approvals', [ApprovalController::class, 'store'])->name('projects.approvals.store');
    Route::get('projects/{project}/approvals/{approval}', [ApprovalController::class, 'show'])->name('projects.approvals.show');
    Route::post('projects/{project}/approvals/{approval}/vote', [ApprovalController::class, 'vote'])->name('projects.approvals.vote');
    Route::post('projects/{project}/approvals/{approval}/cancel', [ApprovalController::class, 'cancel'])->name('projects.approvals.cancel');
});
