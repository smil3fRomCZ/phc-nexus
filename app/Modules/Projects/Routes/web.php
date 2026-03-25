<?php

declare(strict_types=1);

use App\Modules\Projects\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::resource('projects', ProjectController::class);
});
