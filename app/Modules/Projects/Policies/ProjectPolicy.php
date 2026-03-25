<?php

declare(strict_types=1);

namespace App\Modules\Projects\Policies;

use App\Models\User;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Projects\Models\Project;

final class ProjectPolicy
{
    public function __construct(
        private readonly PhiAccessGuard $phiGuard,
    ) {}

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        if (! $this->phiGuard->canAccess($user, $project)) {
            return false;
        }

        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $project->hasMember($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }

    public function update(User $user, Project $project): bool
    {
        if ($user->system_role === SystemRole::Executive) {
            return true;
        }

        if ($user->system_role === SystemRole::ProjectManager) {
            return $project->hasMember($user);
        }

        return false;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->system_role === SystemRole::Executive;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }
}
