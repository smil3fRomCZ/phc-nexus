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

    /** @return list<self> */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Backlog => [self::Todo, self::Cancelled],
            self::Todo => [self::InProgress, self::Backlog, self::Cancelled],
            self::InProgress => [self::InReview, self::Todo, self::Cancelled],
            self::InReview => [self::Done, self::InProgress, self::Cancelled],
            self::Done => [self::InProgress],
            self::Cancelled => [self::Backlog],
        };
    }

    public function canTransitionTo(self $target): bool
    {
        return in_array($target, $this->allowedTransitions(), true);
    }

    /** Stavy zobrazené jako sloupce na kanban boardu. */
    public static function boardColumns(): array
    {
        return [self::Backlog, self::Todo, self::InProgress, self::InReview, self::Done];
    }
}
