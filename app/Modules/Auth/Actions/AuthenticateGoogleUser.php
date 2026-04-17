<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Models\User;
use App\Modules\Auth\Exceptions\DomainNotAllowedException;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\UserStatus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

final class AuthenticateGoogleUser
{
    public function execute(SocialiteUser $socialiteUser, ?string $invitationToken = null): User
    {
        $email = (string) $socialiteUser->getEmail();
        $this->assertDomainAllowed($email);
        $this->assertHostedDomainMatches($socialiteUser, $email);

        $invitation = $invitationToken !== null && $invitationToken !== ''
            ? Invitation::findActiveByToken($invitationToken)
            : null;

        if ($invitation !== null) {
            $this->assertInvitationMatchesIdentity($invitation, $email);
        }

        $existingUser = User::where('email', $email)->first();

        $attributes = [
            'name' => $socialiteUser->getName(),
            'email_verified_at' => now(),
            'avatar_url' => $socialiteUser->getAvatar(),
        ];

        // Invitation attributes (role, team, status) přebíráme pouze pro nově
        // vznikající usery. Existující účet si drží svou roli — jinak by token
        // swap stačil k tiché eskalaci privilegií.
        if ($invitation !== null && $existingUser === null) {
            $attributes['system_role'] = $invitation->system_role;
            $attributes['team_id'] = $invitation->team_id;
            $attributes['status'] = UserStatus::Active;
        } elseif ($invitation !== null && $existingUser !== null) {
            Log::warning('Invitation redeemed by existing user; role unchanged.', [
                'invitation_id' => $invitation->id,
                'user_id' => $existingUser->id,
            ]);
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            $attributes,
        );

        if ($invitation !== null) {
            $invitation->update(['accepted_at' => now()]);
        }

        return $user;
    }

    /**
     * Email z pozvánky musí sedět s Google emailem a pozvánka nesmí být
     * expirovaná. Bez těchto kontrol by stačil útočníkovi získat cizí
     * invitation URL (e-mail forward, shoulder surfing, kompromitovaná
     * inbox) a přihlásit se s ní jakýmkoli allow-listem povoleným účtem
     * → převzal by roli z pozvánky.
     *
     * Chyba je uniformní (DomainNotAllowedException), aby útočník přes
     * error message nerozeznal stav pozvánky.
     *
     * @throws DomainNotAllowedException
     */
    private function assertInvitationMatchesIdentity(Invitation $invitation, string $googleEmail): void
    {
        $invitationEmail = strtolower((string) $invitation->email);
        $normalizedGoogle = strtolower($googleEmail);

        if ($invitationEmail !== $normalizedGoogle) {
            Log::warning('Invitation token used with non-matching Google email.', [
                'invitation_id' => $invitation->id,
                'invitation_email' => $invitationEmail,
                'google_email' => $normalizedGoogle,
            ]);
            throw new DomainNotAllowedException($googleEmail);
        }

        if ($invitation->isExpired()) {
            Log::warning('Expired invitation used during Google callback.', [
                'invitation_id' => $invitation->id,
            ]);
            throw new DomainNotAllowedException($googleEmail);
        }
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

    /**
     * Defense vs. email reuse / spoofing: Google `hd` claim potvrzuje, že účet
     * patří do daného Workspace tenantu. Bez tohoto checku by stačilo, aby měl
     * útočník osobní Google účet s firemní adresou, nebo aby Workspace admin
     * recykloval starý e-mail novému uživateli.
     */
    private function assertHostedDomainMatches(SocialiteUser $socialiteUser, string $email): void
    {
        /** @var array<int, string> $allowed */
        $allowed = config('auth.google_allowed_domains', []);

        if ($allowed === []) {
            return;
        }

        // Mockery proxy ne-implementující metodu vrátí na method_exists false;
        // is_callable spolehlivě funguje pro mock i pro Socialite\Two\User.
        /** @var array<string, mixed> $raw */
        $raw = is_callable([$socialiteUser, 'getRaw']) ? (array) $socialiteUser->getRaw() : [];
        $hd = isset($raw['hd']) ? strtolower((string) $raw['hd']) : null;
        $emailDomain = strtolower(Str::after($email, '@'));

        // hd musí existovat (Workspace účet, ne osobní gmail) a musí odpovídat
        // jak allowlistu, tak doméně z e-mailu.
        if ($hd === null || ! in_array($hd, $allowed, true) || $hd !== $emailDomain) {
            throw new DomainNotAllowedException($email);
        }
    }
}
