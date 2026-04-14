<?php

declare(strict_types=1);

namespace App\Modules\Work\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use App\Modules\Work\Models\TimeEntry;

final class TimeEntryPolicy
{
    public function update(User $user, TimeEntry $timeEntry): bool
    {
        if ($user->system_role === SystemRole::Executive) {
            return true;
        }

        return $timeEntry->user_id === $user->id;
    }

    public function delete(User $user, TimeEntry $timeEntry): bool
    {
        return $this->update($user, $timeEntry);
    }
}
