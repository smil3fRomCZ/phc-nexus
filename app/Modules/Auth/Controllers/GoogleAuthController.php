<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\AuthenticateGoogleUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

final class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(AuthenticateGoogleUser $authenticateUser): RedirectResponse
    {
        $socialiteUser = Socialite::driver('google')->user();

        $user = $authenticateUser->execute($socialiteUser);

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }
}
