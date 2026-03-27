<?php

declare(strict_types=1);

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GlobalApprovalsController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\SearchController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::get('/search', SearchController::class)->name('search');
    Route::get('/my-tasks', MyTasksController::class)->name('my-tasks');
    Route::get('/approvals', GlobalApprovalsController::class)->name('approvals.global');
    Route::get('/calendar', CalendarController::class)->name('calendar');
});

// E2E test login bypass — pouze v testing/local prostředí
if (app()->environment('local', 'testing')) {
    Route::get('/_e2e/login/{email}', function (string $email) {
        $user = User::where('email', $email)->firstOrFail();
        Auth::login($user);

        return redirect('/');
    })->name('e2e.login');
}
