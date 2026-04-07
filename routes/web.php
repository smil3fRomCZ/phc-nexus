<?php

declare(strict_types=1);

use App\Http\Controllers\ApprovalAnalyticsController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GlobalApprovalsController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\SearchController;
use App\Models\User;
use App\Modules\Organization\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
    Route::get('/search', SearchController::class)->name('search');
    Route::get('/my-tasks', MyTasksController::class)->name('my-tasks');
    Route::get('/approvals', GlobalApprovalsController::class)->name('approvals.global');
    Route::get('/calendar', CalendarController::class)->name('calendar');
    Route::get('/admin/approval-analytics', ApprovalAnalyticsController::class)->name('admin.approval-analytics');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar'])->name('profile.avatar.upload');
    Route::delete('/profile/avatar', [ProfileController::class, 'removeAvatar'])->name('profile.avatar.remove');

    Route::patch('/user/board-settings', function (Request $request) {
        $validated = $request->validate([
            'card_fields' => ['required', 'array'],
            'card_fields.*' => ['string', 'in:status,priority,assignee,epic,due_date,comments_count,phi,reporter,story_points'],
        ]);
        $request->user()->update(['board_settings' => $validated]);

        return response()->json(['success' => true]);
    })->name('user.board-settings');
});

// E2E test login bypass — pouze v testing/local prostředí
if (app()->environment('local', 'testing')) {
    Route::get('/_e2e/login/{email}', function (string $email) {
        $user = User::where('email', $email)->firstOrFail();
        Auth::login($user);

        return redirect('/');
    })->name('e2e.login');
}
