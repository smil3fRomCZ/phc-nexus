<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Policies;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Organization\Enums\SystemRole;

final class ApprovalRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ApprovalRequest $request): bool
    {
        // Requester, approvers a Executive/PM mohou vidět
        if (in_array($user->system_role, [SystemRole::Executive, SystemRole::ProjectManager])) {
            return true;
        }

        if ($request->requester_id === $user->id) {
            return true;
        }

        return $request->votes()->where('voter_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return in_array($user->system_role, [
            SystemRole::Executive,
            SystemRole::ProjectManager,
            SystemRole::TeamMember,
        ]);
    }

    public function vote(User $user, ApprovalRequest $request): bool
    {
        if (! $request->isPending()) {
            return false;
        }

        return $request->votes()
            ->where('voter_id', $user->id)
            ->whereNull('decision')
            ->exists();
    }

    public function cancel(User $user, ApprovalRequest $request): bool
    {
        if (! $request->isPending()) {
            return false;
        }

        // Jen requester nebo Executive může zrušit
        return $request->requester_id === $user->id
            || $user->system_role === SystemRole::Executive;
    }
}
