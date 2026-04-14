<?php

declare(strict_types=1);

namespace App\Modules\Comments\Policies;

use App\Models\User;
use App\Modules\Comments\Models\Comment;
use App\Modules\Organization\Enums\SystemRole;

final class CommentPolicy
{
    public function update(User $user, Comment $comment): bool
    {
        if ($user->system_role === SystemRole::Executive) {
            return true;
        }

        return $comment->author_id === $user->id;
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $this->update($user, $comment);
    }
}
