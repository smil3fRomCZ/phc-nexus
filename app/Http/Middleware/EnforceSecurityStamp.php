<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Concurrent session invalidation.
 *
 * Každý přihlášený uživatel má `users.security_stamp`. Při přihlášení
 * se jeho aktuální stamp ukládá do session. Když uživatel vyvolá
 * "odhlásit všechna zařízení", zregenerujeme stamp na User → jiné
 * sessions mají zastaralý stamp a při dalším requestu je odhlásíme.
 */
final class EnforceSecurityStamp
{
    public const SESSION_KEY = 'security_stamp';

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        if (! $user) {
            return $next($request);
        }

        $session = $request->session();
        $sessionStamp = $session->get(self::SESSION_KEY);
        $userStamp = $user->getAttribute('security_stamp');

        // Backward compatibility: session bez stampu (vytvořená před deployem)
        // doplníme aktuálním stampem a pustíme dál.
        if ($sessionStamp === null && $userStamp !== null) {
            $session->put(self::SESSION_KEY, $userStamp);

            return $next($request);
        }

        if ($userStamp !== null && $sessionStamp !== $userStamp) {
            Auth::logout();
            $session->invalidate();
            $session->regenerateToken();

            return redirect()->route('login')
                ->with('error', 'Byli jste odhlášeni — relace byla ukončena z jiného zařízení.');
        }

        return $next($request);
    }
}
