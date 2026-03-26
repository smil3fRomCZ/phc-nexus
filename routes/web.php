<?php

declare(strict_types=1);

use App\Http\Controllers\DashboardController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');
});

// E2E test login bypass — pouze v testing/local prostředí
if (app()->environment('local', 'testing')) {
    Route::get('/_e2e/login/{email}', function (string $email) {
        $user = User::where('email', $email)->firstOrFail();
        Auth::login($user);

        return redirect('/');
    })->name('e2e.login');
}
