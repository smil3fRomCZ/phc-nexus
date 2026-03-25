<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Dashboard/Index');
    })->name('dashboard');
});

// E2E test login bypass — pouze v testing/local prostředí
if (app()->environment('local', 'testing')) {
    Route::get('/_e2e/login/{email}', function (string $email) {
        $user = User::where('email', $email)->firstOrFail();
        Auth::login($user);

        return redirect('/');
    })->name('e2e.login');
}
