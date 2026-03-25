<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Models\AuditEntry;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Automatically log create/update/delete events for a model.
 *
 * Override $auditExclude to skip specific fields from change tracking.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (self $model) {
            app(AuditService::class)->log(
                action: AuditAction::Created,
                entity: $model,
                newValues: $model->getAuditableAttributes(),
            );
        });

        static::updated(function (self $model) {
            $changes = $model->getAuditableChanges();
            if (empty($changes['old']) && empty($changes['new'])) {
                return;
            }

            app(AuditService::class)->log(
                action: AuditAction::Updated,
                entity: $model,
                oldValues: $changes['old'],
                newValues: $changes['new'],
            );
        });

        static::deleted(function (self $model) {
            app(AuditService::class)->log(
                action: AuditAction::Deleted,
                entity: $model,
            );
        });
    }

    public function auditEntries(): MorphMany
    {
        return $this->morphMany(AuditEntry::class, 'entity');
    }

    public function getAuditableAttributes(): array
    {
        return collect($this->getAttributes())
            ->except($this->getAuditExcludedFields())
            ->toArray();
    }

    public function getAuditableChanges(): array
    {
        $changed = $this->getDirty();
        $excluded = $this->getAuditExcludedFields();

        $old = [];
        $new = [];

        foreach ($changed as $key => $value) {
            if (in_array($key, $excluded)) {
                continue;
            }
            $old[$key] = $this->getOriginal($key);
            $new[$key] = $value;
        }

        return ['old' => $old, 'new' => $new];
    }

    protected function getAuditExcludedFields(): array
    {
        return property_exists($this, 'auditExclude')
            ? $this->auditExclude
            : ['password', 'remember_token', 'updated_at', 'created_at'];
    }
}
