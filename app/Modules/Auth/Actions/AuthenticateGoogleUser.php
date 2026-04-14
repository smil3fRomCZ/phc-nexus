<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Auth\Exceptions\DomainNotAllowedException;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

final class AuthenticateGoogleUser
{
    public function execute(SocialiteUser $socialiteUser, ?string $invitationToken = null): User
    {
        $email = (string) $socialiteUser->getEmail();
        $this->assertDomainAllowed($email);

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
            ['email' => $email],
            $attributes,
        );

        if ($invitation) {
            $invitation->update(['accepted_at' => now()]);
        }

        return $user;
    }

    private function assertDomainAllowed(string $email): void
    {
        /** @var array<int, string> $allowed */
        $allowed = config('auth.google_allowed_domains', []);

        // Prázdný allowlist = kontrola vypnutá (např. lokální dev bez konfigurace).
        if ($allowed === []) {
            return;
        }

        $domain = strtolower(Str::after($email, '@'));

        if ($domain === '' || ! in_array($domain, $allowed, true)) {
            throw new DomainNotAllowedException($email);
        }
    }
}
