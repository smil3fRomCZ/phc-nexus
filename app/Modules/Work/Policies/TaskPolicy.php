<?php

declare(strict_types=1);

namespace App\Modules\Work\Policies;

use App\Models\User;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Work\Models\Task;

final class TaskPolicy
{
    public function __construct(
        private readonly PhiAccessGuard $phiGuard,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Task $task): bool
    {
        if (! $this->phiGuard->canAccess($user, $task)) {
            return false;
        }

        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $task->project->hasMember($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
            SystemRole::TeamMember,
        ]);
    }

    public function update(User $user, Task $task): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $task->project->hasMember($user);
    }

    public function delete(User $user, Task $task): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $task->project->getAttribute('owner_id') === $user->id;
    }
}
