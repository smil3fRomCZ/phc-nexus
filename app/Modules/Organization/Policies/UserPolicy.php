<?php

declare(strict_types=1);

namespace App\Modules\Organization\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;

final class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }

    public function view(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return true;
        }

        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }

    public function invite(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }

    /**
     * Executive can update any user (except self role/status).
     */
    public function updateUser(User $user, User $target): bool
    {
        return $user->system_role === SystemRole::Executive;
    }

    public function updateRole(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return false;
        }

        return $user->system_role === SystemRole::Executive;
    }

    public function deactivate(User $user, User $target): bool
    {
        if ($user->id === $target->id) {
            return false;
        }

        return $user->system_role === SystemRole::Executive;
    }
}
