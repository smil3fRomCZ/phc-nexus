<?php

declare(strict_types=1);

namespace App\Modules\Projects\Enums;

enum ProjectStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case OnHold = 'on_hold';
    case Completed = 'completed';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Návrh',
            self::Active => 'Aktivní',
            self::OnHold => 'Pozastavený',
            self::Completed => 'Dokončený',
            self::Archived => 'Archivovaný',
        };
    }
}
