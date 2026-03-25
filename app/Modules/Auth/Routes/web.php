<?php

declare(strict_types=1);

use App\Modules\Auth\Controllers\GoogleAuthController;
use App\Modules\Auth\Controllers\InvitationController;
use App\Modules\Auth\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
    Route::get('/auth/invite/{token}', [InvitationController::class, 'accept'])->name('auth.invite.accept');
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    Route::post('/invitations', [InvitationController::class, 'store'])->name('invitations.store');
});
