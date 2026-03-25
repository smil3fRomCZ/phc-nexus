<?php

declare(strict_types=1);

namespace App\Modules\Organization\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Division extends Model
{
    use HasUuidV7;

    protected $fillable = ['name', 'description'];

    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function members(): HasManyThrough
    {
        return $this->hasManyThrough(User::class, Team::class, 'division_id', 'team_id');
    }
}
