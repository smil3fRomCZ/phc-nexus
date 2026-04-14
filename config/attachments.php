<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Max upload size (v KB)
    |--------------------------------------------------------------------------
    */
    'max_size_kb' => (int) env('ATTACHMENTS_MAX_SIZE_KB', 20480), // 20 MB

    /*
    |--------------------------------------------------------------------------
    | Povolené MIME typy
    |--------------------------------------------------------------------------
    |
    | Whitelist pro upload. Laravel validation `mimetypes` ověřuje skutečný
    | MIME (PHP finfo), ne pouze přípony — .php přejmenované na .pdf neprojde.
    |
    */
    'allowed_mime_types' => [
        // Dokumenty
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'text/markdown',

        // Obrázky
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',

        // Archivy
        'application/zip',
        'application/x-zip-compressed',
        'application/x-7z-compressed',
    ],
];
