<?php

declare(strict_types=1);

namespace App\Modules\Work\Policies;

use App\Models\User;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Work\Models\Epic;

final class EpicPolicy
{
    public function __construct(
        private readonly PhiAccessGuard $phiGuard,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Epic $epic): bool
    {
        if (! $this->phiGuard->canAccess($user, $epic)) {
            return false;
        }

        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $epic->project->hasMember($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
            SystemRole::TeamMember,
        ]);
    }

    public function update(User $user, Epic $epic): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $epic->project->hasMember($user);
    }

    public function delete(User $user, Epic $epic): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }
}
