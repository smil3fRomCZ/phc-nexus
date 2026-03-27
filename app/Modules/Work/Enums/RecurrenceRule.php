<?php

declare(strict_types=1);

namespace App\Modules\Work\Enums;

enum RecurrenceRule: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Biweekly = 'biweekly';
    case Monthly = 'monthly';

    public function label(): string
    {
        return match ($this) {
            self::Daily => 'Denně',
            self::Weekly => 'Týdně',
            self::Biweekly => 'Každé 2 týdny',
            self::Monthly => 'Měsíčně',
        };
    }

    public function nextDate(\DateTimeInterface $from): \DateTimeImmutable
    {
        $date = \DateTimeImmutable::createFromInterface($from);

        return match ($this) {
            self::Daily => $date->modify('+1 day'),
            self::Weekly => $date->modify('+1 week'),
            self::Biweekly => $date->modify('+2 weeks'),
            self::Monthly => $date->modify('+1 month'),
        };
    }
}
