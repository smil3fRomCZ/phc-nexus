<?php

declare(strict_types=1);

use App\Modules\Wiki\Controllers\EpicWikiPageController;
use App\Modules\Wiki\Controllers\WikiAttachmentController;
use App\Modules\Wiki\Controllers\WikiCommentController;
use App\Modules\Wiki\Controllers\WikiPageController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->scopeBindings()->group(function () {
    // Project wiki
    Route::get('projects/{project}/wiki', [WikiPageController::class, 'index'])->name('projects.wiki.index');
    Route::post('projects/{project}/wiki', [WikiPageController::class, 'store'])->name('projects.wiki.store');
    Route::get('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'show'])->name('projects.wiki.show');
    Route::put('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'update'])->name('projects.wiki.update');
    Route::delete('projects/{project}/wiki/{wikiPage}', [WikiPageController::class, 'destroy'])->name('projects.wiki.destroy');

    // Wiki comments & attachments (shared for project + epic pages)
    Route::post('projects/{project}/wiki/{wikiPage}/comments', [WikiCommentController::class, 'store'])->name('projects.wiki.comments.store');
    Route::post('projects/{project}/wiki/{wikiPage}/attachments', [WikiAttachmentController::class, 'store'])->name('projects.wiki.attachments.store');

    // Epic wiki
    Route::get('projects/{project}/epics/{epic}/wiki', [EpicWikiPageController::class, 'index'])->name('projects.epics.wiki.index');
    Route::post('projects/{project}/epics/{epic}/wiki', [EpicWikiPageController::class, 'store'])->name('projects.epics.wiki.store');
    Route::get('projects/{project}/epics/{epic}/wiki/{wikiPage}', [EpicWikiPageController::class, 'show'])->name('projects.epics.wiki.show');
    Route::put('projects/{project}/epics/{epic}/wiki/{wikiPage}', [EpicWikiPageController::class, 'update'])->name('projects.epics.wiki.update');
    Route::delete('projects/{project}/epics/{epic}/wiki/{wikiPage}', [EpicWikiPageController::class, 'destroy'])->name('projects.epics.wiki.destroy');

    // Epic wiki comments & attachments
    Route::post('projects/{project}/epics/{epic}/wiki/{wikiPage}/comments', [WikiCommentController::class, 'store'])->name('projects.epics.wiki.comments.store');
    Route::post('projects/{project}/epics/{epic}/wiki/{wikiPage}/attachments', [WikiAttachmentController::class, 'store'])->name('projects.epics.wiki.attachments.store');
});
