<?php

declare(strict_types=1);

namespace App\Modules\Organization\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Team;

final class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Team $team): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ]);
    }

    public function update(User $user, Team $team): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $team->team_lead_id === $user->id;
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->system_role === SystemRole::Executive;
    }

    public function manageMembers(User $user, Team $team): bool
    {
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        return $team->team_lead_id === $user->id;
    }
}
