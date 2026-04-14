<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\AuthenticateGoogleUser;
use App\Modules\Auth\Exceptions\DomainNotAllowedException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

final class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request, AuthenticateGoogleUser $authenticateUser): RedirectResponse
    {
        if (! $request->has('code')) {
            return redirect()->route('login')
                ->with('error', 'Přihlášení bylo zrušeno.');
        }

        $socialiteUser = Socialite::driver('google')->user();

        $invitationToken = session()->pull('pending_invitation');

        try {
            $user = $authenticateUser->execute($socialiteUser, $invitationToken);
        } catch (DomainNotAllowedException $e) {
            Log::warning('Google SSO: doména zamítnuta', ['email' => $e->email]);

            return redirect()->route('login')
                ->with('error', 'Tvůj Google účet není povolen. Použij prosím pracovní e-mail (pearseurope.com nebo pearshealthcyber.com).');
        }

        // Bez remember=true — SSO nepotřebuje persistent cookie (re-login přes Google je rychlý).
        // Persistent remember token zvyšuje window pro session theft, viz security audit.
        Auth::login($user);

        return redirect()->intended(route('dashboard'));
    }
}
