<?php

declare(strict_types=1);

namespace App\Modules\Audit\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;

final class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->system_role === SystemRole::Executive;
    }
}
