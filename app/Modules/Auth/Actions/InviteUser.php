<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Auth\Mail\InvitationMail;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\SystemRole;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

final class InviteUser
{
    public function execute(
        string $email,
        SystemRole $role,
        ?string $teamId,
        User $invitedBy,
    ): Invitation {
        $invitation = Invitation::create([
            'email' => $email,
            'token' => Str::random(64),
            'system_role' => $role,
            'team_id' => $teamId,
            'invited_by' => $invitedBy->id,
            'expires_at' => now()->addHours(72),
        ]);

        Mail::to($email)->send(new InvitationMail($invitation));

        return $invitation;
    }
}
