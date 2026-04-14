<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Idle session timeout.
 *
 * Laravel `session.lifetime` je absolutní TTL cookie; tento middleware navíc
 * vynucuje idle limit — pokud uživatel nebyl aktivní posledních N minut,
 * provede logout a session regeneraci. Důležité pro PHI prostředí, kde
 * nechceme, aby zapomenutá session na sdíleném zařízení zůstala živá.
 */
final class EnforceIdleTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return $next($request);
        }

        $idleMinutes = (int) config('session.idle_timeout', 30);

        if ($idleMinutes <= 0) {
            return $next($request);
        }

        $session = $request->session();
        $now = time();
        $lastActivity = (int) $session->get('last_activity_at', $now);

        if ($now - $lastActivity > $idleMinutes * 60) {
            Auth::logout();
            $session->invalidate();
            $session->regenerateToken();

            return redirect()->route('login')
                ->with('error', 'Byli jste odhlášeni z důvodu neaktivity.');
        }

        $session->put('last_activity_at', $now);

        return $next($request);
    }
}
