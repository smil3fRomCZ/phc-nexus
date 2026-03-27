<?php

declare(strict_types=1);

namespace App\Modules\Audit\Enums;

enum AuditAction: string
{
    // Entity lifecycle
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case Restored = 'restored';

    // Access
    case Viewed = 'viewed';
    case Downloaded = 'downloaded';
    case Exported = 'exported';

    // Auth
    case LoggedIn = 'logged_in';
    case LoggedOut = 'logged_out';
    case InviteSent = 'invite_sent';
    case InviteAccepted = 'invite_accepted';

    // Approval
    case ApprovalRequested = 'approval_requested';
    case ApprovalApproved = 'approval_approved';
    case ApprovalRejected = 'approval_rejected';

    // Status
    case StatusChanged = 'status_changed';
    case RoleChanged = 'role_changed';
    case Deactivated = 'deactivated';

    // PHI
    case PhiAccessed = 'phi_accessed';
    case PhiClassificationChanged = 'phi_classification_changed';

    public function label(): string
    {
        return str_replace('_', ' ', ucfirst($this->value));
    }
}
