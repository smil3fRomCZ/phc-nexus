<?php

use App\Http\Middleware\EnforceIdleTimeout;
use App\Http\Middleware\EnforceSecurityStamp;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Sentry\Laravel\Integration as SentryIntegration;

return Application::configure(basePath: dirname(__DIR__))
    ->withCommands([
        // Laravel 11+ default auto-discoveruje jen app/Console/Commands/ —
        // moduly v app/Modules/<Name>/Commands/ musí být explicit.
        __DIR__.'/../app/Modules/Organization/Commands',
        __DIR__.'/../app/Modules/Work/Commands',
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('app/Modules/Auth/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Projects/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Work/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Approvals/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Notifications/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Organization/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Audit/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Wiki/Routes/web.php'));
            Route::middleware('web')
                ->group(base_path('app/Modules/Estimation/Routes/web.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Caddy (nebo jakákoli reverse proxy) je jediný vstup do aplikace →
        // důvěřuj X-Forwarded-* headerům. Bez toho vrací Request::ip() vnitřní
        // Docker IP, rate limitery throttlují všechny uživatele globálně
        // a audit log nemá forensics value. Pro restrict na konkrétní CIDR
        // viz AppServiceProvider::boot() (env TRUSTED_PROXIES).
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->web(append: [
            HandleInertiaRequests::class,
            EnsureUserIsActive::class,
            EnforceIdleTimeout::class,
            EnforceSecurityStamp::class,
        ]);
        $middleware->throttleWithRedis();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Sentry error reporting — DSN prázdný = no-op (dev/test), v prod
        // vše co projde standardním Laravel exception handlerem jde i do
        // Sentry (včetně failed jobs, scheduler errors, http 5xx).
        SentryIntegration::handles($exceptions);
    })->create();
