<?php

declare(strict_types=1);

namespace App\Modules\Audit;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;

final class AuditService
{
    public function log(
        AuditAction $action,
        Model $entity,
        ?array $payload = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): ?AuditEntry {
        $masked = $this->isPhiRestricted($entity, $action);

        $attributes = [
            'action' => $action,
            'entity_type' => $entity->getMorphClass(),
            'entity_id' => $entity->getKey(),
            'actor_id' => Auth::id(),
            'payload' => $masked ? self::maskedPlaceholder() : $payload,
            'old_values' => $masked ? self::maskedPlaceholder() : $oldValues,
            'new_values' => $masked ? self::maskedPlaceholder() : $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ];

        // Uvnitř transakce odložíme zápis po commitu — při rollbacku se audit nezapíše.
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(static fn () => AuditEntry::create($attributes));

            return null;
        }

        return AuditEntry::create($attributes);
    }

    /**
     * @return array{_masked: true, reason: string}
     */
    private static function maskedPlaceholder(): array
    {
        return ['_masked' => true, 'reason' => 'PHI/unknown classification'];
    }

    private function isPhiRestricted(Model $entity, AuditAction $action): bool
    {
        // PhiClassificationChanged je meta-audit o samotné klasifikaci —
        // jeho payload (from/to/reason) musí zůstat čitelný, jinak by byl
        // audit bezcenný. Normální PHI masking se na něj nevztahuje.
        if ($action === AuditAction::PhiClassificationChanged) {
            return false;
        }

        // Bez volání reflection na každý log — stačí detekovat metodu traitu.
        return method_exists($entity, 'isPhiRestricted') && $entity->isPhiRestricted();
    }
}
