<?php

declare(strict_types=1);

namespace App\Modules\Organization\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Invited = 'invited';
    case Deactivated = 'deactivated';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Aktivní',
            self::Invited => 'Pozvaný',
            self::Deactivated => 'Deaktivovaný',
        };
    }
}
