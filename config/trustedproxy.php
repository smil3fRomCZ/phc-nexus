<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Trusted Proxies
    |--------------------------------------------------------------------------
    |
    | Caddy (a jakákoli reverse proxy) předává X-Forwarded-* headery. Bez
    | důvěry vrací Request::ip() vnitřní IP kontejneru → rate limitery
    | throttlují všechny uživatele globálně a audit log ztrácí forensics
    | value. Nastav na "*" pokud je Caddy jediným vstupem do app (běžný
    | docker-compose setup), nebo na čárkami oddělené IP/CIDR.
    |
    */

    'at' => env('TRUSTED_PROXIES', '*'),
];
