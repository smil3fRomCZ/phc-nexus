<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\ProjectUpdate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
            'projectTabConfig' => fn () => $this->resolveProjectTabConfig($request),
            'projectCanUpdate' => fn () => $this->resolveProjectCanUpdate($request),
        ];
    }

    private function resolveProjectCanUpdate(Request $request): bool
    {
        $project = $request->route('project');

        if (! $project instanceof Project) {
            return false;
        }

        return $request->user() !== null && Gate::allows('update', $project);
    }

    /**
     * @return array{order: list<string>, hidden: list<string>}|null
     */
    private function resolveProjectTabConfig(Request $request): ?array
    {
        $project = $request->route('project');

        if (! $project instanceof Project) {
            return null;
        }

        $config = $project->tab_config;

        if (! is_array($config)) {
            return null;
        }

        /** @var list<string> $order */
        $order = array_values(array_filter(
            is_array($config['order'] ?? null) ? $config['order'] : [],
            'is_string',
        ));
        /** @var list<string> $hidden */
        $hidden = array_values(array_filter(
            is_array($config['hidden'] ?? null) ? $config['hidden'] : [],
            'is_string',
        ));

        return ['order' => $order, 'hidden' => $hidden];
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
