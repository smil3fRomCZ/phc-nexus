<?php

declare(strict_types=1);

namespace App\Modules\Audit\Enums;

enum PhiClassification: string
{
    case Phi = 'phi';
    case NonPhi = 'non_phi';
    case Unknown = 'unknown';

    public function label(): string
    {
        return match ($this) {
            self::Phi => 'PHI',
            self::NonPhi => 'Non-PHI',
            self::Unknown => 'Unknown',
        };
    }

    public function isRestricted(): bool
    {
        return match ($this) {
            self::Phi, self::Unknown => true,
            self::NonPhi => false,
        };
    }
}
