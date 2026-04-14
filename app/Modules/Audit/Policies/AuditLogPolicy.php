<?php

declare(strict_types=1);

namespace App\Modules\Audit\Policies;

use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;

final class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
        ], true);
    }

    /**
     * Plný (global) pohled na audit trail — napříč všemi projekty a uživateli.
     * Ostatní role sice mohou audit otevřít (viewAny), ale výsledky jsou
     * omezené na jejich scope (entries, které sami způsobili, nebo entity
     * v projektech, kde jsou členy).
     */
    public function viewAll(User $user): bool
    {
        return $user->system_role === SystemRole::Executive;
    }
}
