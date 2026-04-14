<?php

declare(strict_types=1);

use App\Modules\Auth\Controllers\GoogleAuthController;
use App\Modules\Auth\Controllers\InvitationController;
use App\Modules\Auth\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

// Guest routes — named limitery (v testech vypnuté, viz AppServiceProvider)
Route::middleware(['guest', 'throttle:guest-login'])->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
});

Route::middleware(['guest', 'throttle:guest-sso'])->group(function () {
    Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
});

Route::middleware(['guest', 'throttle:invite-accept'])->group(function () {
    Route::get('/auth/invite/{token}', [InvitationController::class, 'accept'])->name('auth.invite.accept');
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    Route::post('/invitations', [InvitationController::class, 'store'])->middleware('throttle:10,1')->name('invitations.store');
});
