<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use Laravel\Socialite\Contracts\User as SocialiteUser;

final class AuthenticateGoogleUser
{
    public function execute(SocialiteUser $socialiteUser): User
    {
        return User::updateOrCreate(
            ['email' => $socialiteUser->getEmail()],
            [
                'name' => $socialiteUser->getName(),
                'email_verified_at' => now(),
            ],
        );
    }
}
