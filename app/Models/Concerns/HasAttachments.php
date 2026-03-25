<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Modules\Files\Models\Attachment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Add polymorphic attachment support to a model.
 */
trait HasAttachments
{
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable');
    }
}
