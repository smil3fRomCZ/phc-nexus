<?php

declare(strict_types=1);

namespace App\Modules\Work\Enums;

enum TaskStatus: string
{
    case Backlog = 'backlog';
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case InReview = 'in_review';
    case Done = 'done';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Backlog => 'Backlog',
            self::Todo => 'K zpracování',
            self::InProgress => 'V průběhu',
            self::InReview => 'V revizi',
            self::Done => 'Hotovo',
            self::Cancelled => 'Zrušeno',
        };
    }
}
