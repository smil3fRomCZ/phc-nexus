<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Cross-driver helper pro case-insensitive LIKE.
 *
 * Postgres podporuje `ILIKE`, SQLite (pro testy) má `LIKE` case-insensitive
 * default pro ASCII. Pro unicode používáme `LOWER()` s parametrizovaným
 * bindem — user input je vždy v bind parameteru, ne v SQL expression.
 */
final class CaseInsensitiveLike
{
    /**
     * Aplikuje case-insensitive LIKE na sloupec.
     * Pattern se očekává již s % wildcardy (volající je dodá).
     */
    public static function apply(Builder $query, string $column, string $pattern): Builder
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            return $query->where($column, 'ilike', $pattern);
        }

        // SQLite + ostatní: LOWER(column) LIKE lower(pattern).
        // Bind je stále parametrizovaný — proti SQL injection chráněno.
        return $query->whereRaw("LOWER({$column}) LIKE ?", [mb_strtolower($pattern)]);
    }

    public static function applyOr(Builder $query, string $column, string $pattern): Builder
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            return $query->orWhere($column, 'ilike', $pattern);
        }

        return $query->orWhereRaw("LOWER({$column}) LIKE ?", [mb_strtolower($pattern)]);
    }
}
