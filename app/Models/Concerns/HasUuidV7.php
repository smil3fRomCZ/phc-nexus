<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Symfony\Component\Uid\Uuid;

/**
 * Use UUIDv7 as primary key (timestamp-ordered, sortable).
 */
trait HasUuidV7
{
    use HasUuids;

    public function newUniqueId(): string
    {
        return (string) Uuid::v7();
    }

    public function uniqueIds(): array
    {
        return [$this->getKeyName()];
    }
}
