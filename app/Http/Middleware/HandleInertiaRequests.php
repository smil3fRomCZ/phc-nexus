<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    /** @phpstan-ignore-next-line */
                    'system_role' => $request->user()->system_role->value,
                    'avatar_url' => $request->user()->avatar_url,
                    'avatar_path' => $request->user()->avatar_path,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notificationCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
        ];
    }
}
