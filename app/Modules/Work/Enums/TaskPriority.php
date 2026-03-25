<?php

declare(strict_types=1);

namespace App\Modules\Work\Enums;

enum TaskPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Nízká',
            self::Medium => 'Střední',
            self::High => 'Vysoká',
            self::Urgent => 'Urgentní',
        };
    }
}
