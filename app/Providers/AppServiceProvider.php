<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Modules\Approvals\Models\ApprovalRequest;
use App\Modules\Approvals\Policies\ApprovalRequestPolicy;
use App\Modules\Audit\Models\AuditEntry;
use App\Modules\Audit\Policies\AuditLogPolicy;
use App\Modules\Comments\Models\Comment;
use App\Modules\Comments\Policies\CommentPolicy;
use App\Modules\Files\Models\Attachment;
use App\Modules\Files\Policies\AttachmentPolicy;
use App\Modules\Organization\Models\Division;
use App\Modules\Organization\Models\Team;
use App\Modules\Organization\Policies\DivisionPolicy;
use App\Modules\Organization\Policies\TeamPolicy;
use App\Modules\Organization\Policies\UserPolicy;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Policies\ProjectPolicy;
use App\Modules\Work\Models\Epic;
use App\Modules\Work\Models\Task;
use App\Modules\Work\Models\TimeEntry;
use App\Modules\Work\Policies\EpicPolicy;
use App\Modules\Work\Policies\TaskPolicy;
use App\Modules\Work\Policies\TimeEntryPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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
        Gate::policy(AuditEntry::class, AuditLogPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(TimeEntry::class, TimeEntryPolicy::class);
        Gate::policy(Attachment::class, AttachmentPolicy::class);

        $this->configureRateLimiters();
        $this->configureTrustedProxies();
    }

    private function configureTrustedProxies(): void
    {
        $proxies = (string) config('trustedproxy.at', '*');

        if ($proxies !== '*' && $proxies !== '') {
            TrustProxies::at(array_map('trim', explode(',', $proxies)));
        }
    }

    private function configureRateLimiters(): void
    {
        // V testech throttle vypnutý (jinak 5/min rychle vyčerpá jedno IP).
        $testing = $this->app->environment('testing');

        RateLimiter::for('guest-login', fn (Request $r) => $testing
            ? Limit::none()
            : Limit::perMinute(20)->by($r->ip()));

        RateLimiter::for('guest-sso', fn (Request $r) => $testing
            ? Limit::none()
            : Limit::perMinute(10)->by($r->ip()));

        RateLimiter::for('invite-accept', fn (Request $r) => $testing
            ? Limit::none()
            : Limit::perMinute(5)->by($r->ip()));
    }
}
