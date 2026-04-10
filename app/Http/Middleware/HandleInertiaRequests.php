<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\ProjectUpdate;
use Illuminate\Http\Request;
use Inertia\Middleware;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    /** @phpstan-ignore-next-line */
                    'system_role' => $request->user()->system_role->value,
                    'avatar_url' => $request->user()->avatar_url,
                    'avatar_path' => $request->user()->avatar_path,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'created_task_id' => $request->session()->get('created_task_id'),
            ],
            'notificationCount' => fn () => $request->user()?->unreadNotifications()->count() ?? 0,
            'projectLastUpdate' => fn () => $this->resolveProjectLastUpdate($request),
        ];
    }

    /**
     * @return array{health: string, created_at: string|null}|null
     */
    private function resolveProjectLastUpdate(Request $request): ?array
    {
        $project = $request->route('project');

        if (! $project instanceof Project) {
            return null;
        }

        $update = ProjectUpdate::query()
            ->where('project_id', $project->id)
            ->latest()
            ->first();

        if (! $update) {
            return null;
        }

        return [
            'health' => $update->health,
            'created_at' => $update->created_at?->toIso8601String(),
        ];
    }
}
