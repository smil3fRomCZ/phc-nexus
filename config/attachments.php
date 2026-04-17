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
        // SVG záměrně vynecháno — může obsahovat inline <script> / XSS payload.
        // Pokud v budoucnu potřeba, použít SVG sanitizér (např. enshrined/svg-sanitize)
        // a samostatný upload endpoint s post-processingem.

        // Archivy
        'application/zip',
        'application/x-zip-compressed',
        'application/x-7z-compressed',
    ],

    /*
    |--------------------------------------------------------------------------
    | Povolené MIME typy pro inline obrázky (wiki RichTextEditor)
    |--------------------------------------------------------------------------
    |
    | Wiki storeImage endpoint embedduje obrázek zpět do same-origin URL;
    | SVG by se při přímém otevření vykonalo jako dokument (XSS). Držíme
    | vlastní — menší — whitelist, který nikdy nezahrnuje svg/xml/html.
    |
    */
    'allowed_image_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ],

    /*
    |--------------------------------------------------------------------------
    | Max upload size pro wiki inline obrázky (v KB)
    |--------------------------------------------------------------------------
    */
    'max_image_size_kb' => (int) env('ATTACHMENTS_MAX_IMAGE_SIZE_KB', 10240), // 10 MB
];
