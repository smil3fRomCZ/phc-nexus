<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Approvals\Policies\ApprovalRequestPolicy;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Policies\DivisionPolicy;
use App\Modules\Organization\Policies\TeamPolicy;
use App\Modules\Organization\Policies\UserPolicy;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Policies\ProjectPolicy;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Policies\EpicPolicy;
use App\Modules\Work\Policies\TaskPolicy;
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
        Gate::policy(Epic::class, EpicPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(ApprovalRequest::class, ApprovalRequestPolicy::class);
    }
}
