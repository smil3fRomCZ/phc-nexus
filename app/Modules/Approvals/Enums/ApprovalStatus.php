<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Enums;

enum ApprovalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Čeká na schválení',
            self::Approved => 'Schváleno',
            self::Rejected => 'Zamítnuto',
            self::Cancelled => 'Zrušeno',
        };
    }

    public function isResolved(): bool
    {
        return in_array($this, [self::Approved, self::Rejected, self::Cancelled]);
    }
}
