<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\UserStatus;
use Laravel\Socialite\Contracts\User as SocialiteUser;

final class AuthenticateGoogleUser
{
    public function execute(SocialiteUser $socialiteUser, ?string $invitationToken = null): User
    {
        $invitation = $invitationToken
            ? Invitation::where('token', $invitationToken)->whereNull('accepted_at')->first()
            : null;

        $attributes = [
            'name' => $socialiteUser->getName(),
            'email_verified_at' => now(),
            'avatar_url' => $socialiteUser->getAvatar(),
        ];

        if ($invitation) {
            $attributes['system_role'] = $invitation->system_role;
            $attributes['team_id'] = $invitation->team_id;
            $attributes['status'] = UserStatus::Active;
        }

        $user = User::updateOrCreate(
            ['email' => $socialiteUser->getEmail()],
            $attributes,
        );

        if ($invitation) {
            $invitation->update(['accepted_at' => now()]);
        }

        return $user;
    }
}
