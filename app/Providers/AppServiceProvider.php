<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Policies\DivisionPolicy;
use App\Modules\Organization\Policies\TeamPolicy;
use App\Modules\Organization\Policies\UserPolicy;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Policies\ProjectPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Division::class, DivisionPolicy::class);
        Gate::policy(Team::class, TeamPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
    }
}
