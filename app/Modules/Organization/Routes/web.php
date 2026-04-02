<?php

declare(strict_types=1);

use App\Modules\Organization\Controllers\OrganizationController;
use App\Modules\Organization\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
    Route::patch('users/{user}/role', [UserController::class, 'updateRole'])->name('admin.users.updateRole');
    Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])->name('admin.users.deactivate');
    Route::post('users/{user}/activate', [UserController::class, 'activate'])->name('admin.users.activate');
    Route::get('organization', OrganizationController::class)->name('admin.organization');

    // Divisions CRUD
    Route::post('divisions', [OrganizationController::class, 'storeDivision'])->name('admin.divisions.store');
    Route::put('divisions/{division}', [OrganizationController::class, 'updateDivision'])->name('admin.divisions.update');
    Route::delete('divisions/{division}', [OrganizationController::class, 'destroyDivision'])->name('admin.divisions.destroy');

    // Teams CRUD
    Route::post('teams', [OrganizationController::class, 'storeTeam'])->name('admin.teams.store');
    Route::put('teams/{team}', [OrganizationController::class, 'updateTeam'])->name('admin.teams.update');
    Route::delete('teams/{team}', [OrganizationController::class, 'destroyTeam'])->name('admin.teams.destroy');

    // Team members
    Route::post('teams/{team}/members', [OrganizationController::class, 'addMember'])->name('admin.teams.members.add');
    Route::delete('teams/{team}/members/{user}', [OrganizationController::class, 'removeMember'])->name('admin.teams.members.remove');
});
