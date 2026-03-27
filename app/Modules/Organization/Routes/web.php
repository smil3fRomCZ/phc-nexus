<?php

declare(strict_types=1);

use App\Modules\Organization\Controllers\OrganizationController;
use App\Modules\Organization\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('organization', OrganizationController::class)->name('admin.organization');
});
