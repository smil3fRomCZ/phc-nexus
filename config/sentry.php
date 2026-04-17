<?php

declare(strict_types=1);

/**
 * Sentry Laravel SDK configuration.
 *
 * DSN prázdný = SDK je no-op (dev a test prostředí). V prod/staging
 * nastavit SENTRY_LARAVEL_DSN v .env.
 *
 * @see https://docs.sentry.io/platforms/php/guides/laravel/configuration/options/
 */
return [

    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    // Verze aplikace — Sentry spojí issue s release pro regression detection.
    // V CI deployi se nastavuje na git SHA.
    'release' => env('SENTRY_RELEASE'),

    // Fallback na APP_ENV, ale lze explicit override (např. "prod-eu1").
    'environment' => env('SENTRY_ENVIRONMENT'),

    // Sampling — 100 % error events, žádné traces (traces = performance
    // monitoring, pro 200 user internal app zbytečný noise + účty na free tier).
    'sample_rate' => env('SENTRY_SAMPLE_RATE') === null ? 1.0 : (float) env('SENTRY_SAMPLE_RATE'),
    'traces_sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE') === null ? null : (float) env('SENTRY_TRACES_SAMPLE_RATE'),
    'profiles_sample_rate' => env('SENTRY_PROFILES_SAMPLE_RATE') === null ? null : (float) env('SENTRY_PROFILES_SAMPLE_RATE'),

    // PHI/GDPR: NIKDY neposílat automaticky user email/IP/cookies do Sentry.
    // Pro PHC Nexus (healthcare data) to je hard requirement — manuálně
    // setContext přes Sentry API pro potřebný kontext, nic automaticky.
    'send_default_pii' => false,

    'ignore_transactions' => [
        '/up', // health check — neposílat do Sentry
    ],

    'breadcrumbs' => [
        'logs' => env('SENTRY_BREADCRUMBS_LOGS_ENABLED', true),
        'cache' => env('SENTRY_BREADCRUMBS_CACHE_ENABLED', true),
        // SQL queries jsou často PHI-obsahující → jen bindings=false (default),
        // aby se do breadcrumbs nedostalo `SELECT * FROM tasks WHERE title = 'JUDr. Pacient...'`
        'sql_queries' => env('SENTRY_BREADCRUMBS_SQL_QUERIES_ENABLED', true),
        'sql_bindings' => env('SENTRY_BREADCRUMBS_SQL_BINDINGS_ENABLED', false),
        'queue_info' => env('SENTRY_BREADCRUMBS_QUEUE_INFO_ENABLED', true),
        'command_info' => env('SENTRY_BREADCRUMBS_COMMAND_JOBS_ENABLED', true),
        'http_client_requests' => env('SENTRY_BREADCRUMBS_HTTP_CLIENT_REQUESTS_ENABLED', true),
        'notifications' => env('SENTRY_BREADCRUMBS_NOTIFICATIONS_ENABLED', true),
    ],

    'tracing' => [
        // Tracing vypnutý by default (traces_sample_rate null).
        // Níže jsou flagy pro případ že někdo traces zapne.
        'queue_job_transactions' => env('SENTRY_TRACE_QUEUE_ENABLED', false),
        'queue_jobs' => env('SENTRY_TRACE_QUEUE_JOBS_ENABLED', false),
        'sql_queries' => env('SENTRY_TRACE_SQL_QUERIES_ENABLED', false),
        'sql_bindings' => false, // PHI
        'views' => env('SENTRY_TRACE_VIEWS_ENABLED', false),
        'http_client_requests' => env('SENTRY_TRACE_HTTP_CLIENT_REQUESTS_ENABLED', false),
        'cache' => env('SENTRY_TRACE_CACHE_ENABLED', false),
        'redis_commands' => false,
        'continue_after_response' => true,
        'default_integrations' => true,
    ],
];
