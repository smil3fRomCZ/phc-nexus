<?php

declare(strict_types=1);

namespace App\Modules\Audit;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

final class AuditService
{
    public function log(
        AuditAction $action,
        Model $entity,
        ?array $payload = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): AuditEntry {
        return AuditEntry::create([
            'action' => $action,
            'entity_type' => $entity->getMorphClass(),
            'entity_id' => $entity->getKey(),
            'actor_id' => Auth::id(),
            'payload' => $payload,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
