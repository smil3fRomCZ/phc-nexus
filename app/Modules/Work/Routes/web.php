<?php

declare(strict_types=1);

use App\Modules\Work\Controllers\EpicController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('projects.epics', EpicController::class)->except(['create', 'edit']);
});
