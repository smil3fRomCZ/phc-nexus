<?php

declare(strict_types=1);

use App\Modules\Audit\Controllers\AuditLogController;
use App\Modules\Audit\Controllers\PhiReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('audit-log', AuditLogController::class)->name('admin.audit-log');
    Route::get('phi-report', PhiReportController::class)->name('admin.phi-report');
});
