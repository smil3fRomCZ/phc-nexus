<?php

declare(strict_types=1);

namespace App\Modules\Audit;

use App\Models\Concerns\HasPhiClassification;
use App\Models\User;
use App\Modules\Organization\Enums\SystemRole;
use Illuminate\Database\Eloquent\Model;

/**
 * Centralized PHI access check.
 *
 * MVP rules:
 * - Reader role: no PHI access
 * - Guest (future): no PHI access
 * - Others: PHI access allowed (subject to entity-level policy)
 */
final class PhiAccessGuard
{
    public function canAccess(User $user, Model $entity): bool
    {
        if (! $this->isPhiEntity($entity)) {
            return true;
        }

        if (! $entity->isPhiRestricted()) {
            return true;
        }

        return $this->userHasPhiClearance($user);
    }

    public function canExport(User $user, Model $entity): bool
    {
        if (! $this->isPhiEntity($entity)) {
            return true;
        }

        if ($entity->isPhiRestricted()) {
            return false;
        }

        return true;
    }

    public function userHasPhiClearance(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
            SystemRole::TeamMember,
            SystemRole::ServiceDeskAgent,
        ]);
    }

    private function isPhiEntity(Model $entity): bool
    {
        return in_array(HasPhiClassification::class, class_uses_recursive($entity));
    }
}
