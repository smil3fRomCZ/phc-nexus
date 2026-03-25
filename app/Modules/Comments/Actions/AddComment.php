<?php

declare(strict_types=1);

namespace App\Modules\Comments\Actions;

use App\Models\User;
use App\Modules\Comments\Models\Comment;
use Illuminate\Database\Eloquent\Model;

final class AddComment
{
    public function execute(
        Model $commentable,
        User $author,
        string $body,
        ?string $parentId = null,
    ): Comment {
        return Comment::create([
            'commentable_type' => $commentable->getMorphClass(),
            'commentable_id' => $commentable->getKey(),
            'author_id' => $author->id,
            'body' => $body,
            'parent_id' => $parentId,
        ]);
    }
}
