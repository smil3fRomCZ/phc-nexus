<?php

declare(strict_types=1);

namespace App\Modules\Comments\Actions;

use App\Modules\Comments\Models\Comment;

final class EditComment
{
    public function execute(Comment $comment, string $body): Comment
    {
        $comment->update([
            'body' => $body,
            'edited_at' => now(),
        ]);

        return $comment;
    }
}
