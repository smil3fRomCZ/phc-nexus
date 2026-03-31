<?php

declare(strict_types=1);

use App\Modules\Wiki\Controllers\WikiPageController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->scopeBindings()->group(function () {
    Route::get('projects/{project}/wiki', [WikiPageController::class, 'index'])->name('projects.wiki.index');
    Route::post('projects/{project}/wiki', [WikiPageController::class, 'store'])->name('projects.wiki.store');
    Route::get('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'show'])->name('projects.wiki.show');
    Route::put('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'update'])->name('projects.wiki.update');
    Route::delete('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'destroy'])->name('projects.wiki.destroy');
});
