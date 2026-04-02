<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\AuthenticateGoogleUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        $user = $authenticateUser->execute($socialiteUser, $invitationToken);

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }
}
