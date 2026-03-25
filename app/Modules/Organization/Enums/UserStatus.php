<?php

declare(strict_types=1);

namespace App\Modules\Organization\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Invited = 'invited';
    case Deactivated = 'deactivated';
}
