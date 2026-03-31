<?php

declare(strict_types=1);

namespace App\Modules\Projects\Enums;

enum BenefitType: string
{
    case Revenue = 'revenue';
    case Costsave = 'costsave';
    case Legal = 'legal';
    case Platform = 'platform';
    case Strategy = 'strategy';

    public function label(): string
    {
        return match ($this) {
            self::Revenue => 'Obrat',
            self::Costsave => 'Costsave',
            self::Legal => 'Legal',
            self::Platform => 'Platforma',
            self::Strategy => 'Strategie',
        };
    }

    public function hasMoneyField(): bool
    {
        return in_array($this, [self::Revenue, self::Costsave], true);
    }
}
