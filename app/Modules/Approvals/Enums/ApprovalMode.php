<?php

declare(strict_types=1);

namespace App\Modules\Approvals\Enums;

enum ApprovalMode: string
{
    case AllApprove = 'all_approve';

    public function label(): string
    {
        return match ($this) {
            self::AllApprove => 'Všichni musí schválit',
        };
    }
}
