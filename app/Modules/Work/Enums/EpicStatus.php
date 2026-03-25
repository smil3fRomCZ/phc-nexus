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

    /** @return list<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Backlog => [self::InProgress, self::Cancelled],
            self::InProgress => [self::Done, self::Backlog, self::Cancelled],
            self::Done => [self::InProgress],
            self::Cancelled => [self::Backlog],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }
}
