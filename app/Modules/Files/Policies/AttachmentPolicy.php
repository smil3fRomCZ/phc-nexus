<?php

declare(strict_types=1);

namespace App\Modules\Files\Policies;

use App\Models\User;
use App\Modules\Files\Models\Attachment;
use App\Modules\Organization\Enums\SystemRole;

final class AttachmentPolicy
{
    public function delete(User $user, Attachment $attachment): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager], true)) {
            return true;
        }

        return $attachment->uploaded_by === $user->id;
    }
}
