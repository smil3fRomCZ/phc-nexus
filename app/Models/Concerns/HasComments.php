<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Modules\Comments\Models\Comment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Add polymorphic comment thread support to a model.
 */
trait HasComments
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function rootComments(): MorphMany
    {
        return $this->comments()->whereNull('parent_id');
    }
}
