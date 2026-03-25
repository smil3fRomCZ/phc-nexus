<?php

declare(strict_types=1);

namespace App\Modules\Work\Enums;

enum EpicStatus: string
{
    case Backlog = 'backlog';
    case InProgress = 'in_progress';
    case Done = 'done';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Backlog => 'Backlog',
            self::InProgress => 'V průběhu',
            self::Done => 'Hotovo',
            self::Cancelled => 'Zrušeno',
        };
    }
}
