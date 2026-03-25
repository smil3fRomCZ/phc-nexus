<?php

declare(strict_types=1);

namespace App\Modules\Organization\Enums;

enum SystemRole: string
{
    case Executive = 'executive';
    case ProjectManager = 'project_manager';
    case TeamMember = 'team_member';
    case ServiceDeskAgent = 'service_desk_agent';
    case Reader = 'reader';

    public function label(): string
    {
        return match ($this) {
            self::Executive => 'Executive',
            self::ProjectManager => 'Project Manager',
            self::TeamMember => 'Team Member',
            self::ServiceDeskAgent => 'Service Desk Agent',
            self::Reader => 'Reader',
        };
    }
}
