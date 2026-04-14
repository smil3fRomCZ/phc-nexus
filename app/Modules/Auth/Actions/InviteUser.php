<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Auth\Mail\InvitationMail;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\SystemRole;
use Illuminate\Support\Facades\Mail;

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
            // 256-bit entropy (32 bytes → 64 hex znaků). Str::random používá bezpečný
            // generátor, ale s menší abecedou; explicit hex je odolnější vůči
            // enumeraci a snadno dohledatelný v logách jako náhodný řetězec.
            'token' => bin2hex(random_bytes(32)),
            'system_role' => $role,
            'team_id' => $teamId,
            'invited_by' => $invitedBy->id,
            'expires_at' => now()->addHours(24),
        ]);

        Mail::to($email)->send(new InvitationMail($invitation));

        return $invitation;
    }
}
