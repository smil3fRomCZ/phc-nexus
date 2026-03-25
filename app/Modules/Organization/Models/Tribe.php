<?php

declare(strict_types=1);

namespace App\Modules\Organization\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tribe extends Model
{
    use HasUuidV7;

    protected $fillable = ['name', 'description', 'tribe_lead_id'];

    public function tribeLead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tribe_lead_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
