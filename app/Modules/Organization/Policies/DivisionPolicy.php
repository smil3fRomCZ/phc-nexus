<?php

declare(strict_types=1);

namespace App\Modules\Organization\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Organization\Models\Division;

final class DivisionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Division $division): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
        ]);
    }

    public function update(User $user, Division $division): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
        ]);
    }

    public function delete(User $user, Division $division): bool
    {
        return $user->system_role === SystemRole::Executive;
    }
}
