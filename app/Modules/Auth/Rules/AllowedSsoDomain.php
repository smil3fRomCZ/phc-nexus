<?php

declare(strict_types=1);

namespace App\Modules\Auth\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;

final class AllowedSsoDomain implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        /** @var array<int, string> $allowed */
        $allowed = config('auth.google_allowed_domains', []);

        if ($allowed === []) {
            return;
        }

        if (! is_string($value) || ! str_contains($value, '@')) {
            $fail('Neplatný e-mail.');

            return;
        }

        $domain = strtolower(Str::after($value, '@'));

        if (! in_array($domain, $allowed, true)) {
            $fail('E-mail musí být z povolené domény ('.implode(', ', $allowed).').');
        }
    }
}
