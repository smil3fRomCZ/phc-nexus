<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Modules\Audit\Enums\PhiClassification;
use Illuminate\Database\Eloquent\Builder;

/**
 * Add PHI classification field and scopes to a model.
 *
 * Requires `data_classification` varchar column on the table.
 * Default: 'unknown' (treated as PHI in MVP).
 */
trait HasPhiClassification
{
    public function initializeHasPhiClassification(): void
    {
        $this->fillable[] = 'data_classification';
    }

    public function getDataClassificationAttribute(?string $value): PhiClassification
    {
        return PhiClassification::tryFrom($value ?? '') ?? PhiClassification::Unknown;
    }

    public function setDataClassificationAttribute(PhiClassification|string $value): void
    {
        $this->attributes['data_classification'] = $value instanceof PhiClassification
            ? $value->value
            : $value;
    }

    public function isPhiRestricted(): bool
    {
        return $this->data_classification->isRestricted();
    }

    public function scopeNonPhi(Builder $query): Builder
    {
        return $query->where('data_classification', PhiClassification::NonPhi->value);
    }

    public function scopePhiRestricted(Builder $query): Builder
    {
        return $query->whereIn('data_classification', [
            PhiClassification::Phi->value,
            PhiClassification::Unknown->value,
        ]);
    }

    public function scopeExportable(Builder $query): Builder
    {
        return $this->scopeNonPhi($query);
    }
}
