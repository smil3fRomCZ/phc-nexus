<?php

declare(strict_types=1);

namespace App\Modules\Projects\Models;

use App\Models\Concerns\HasUuidV7;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectUpdate extends Model
{
    use HasUuidV7;

    protected $fillable = [
        'project_id',
        'author_id',
        'health',
        'body',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
