<?php

declare(strict_types=1);

namespace App\Modules\Organization\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Database\Factories\DivisionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Division extends Model
{
    /** @use HasFactory<DivisionFactory> */
    use HasFactory, HasUuidV7;

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
