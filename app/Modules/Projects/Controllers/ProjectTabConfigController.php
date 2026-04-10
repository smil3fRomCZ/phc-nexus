<?php

declare(strict_types=1);

namespace App\Modules\Projects\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

final class ProjectTabConfigController extends Controller
{
    /**
     * All tab keys that the UI recognises. The customization can only
     * reference these — unknown keys are rejected by the validator.
     *
     * @var list<string>
     */
    public const TAB_KEYS = [
        'overview',
        'board',
        'table',
        'epics',
        'members',
        'time',
        'gantt',
        'workflow',
        'estimation',
        'reports',
        'history',
        'approvals',
        'wiki',
    ];

    public function update(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['required', 'string', Rule::in(self::TAB_KEYS)],
            'hidden' => ['sometimes', 'array'],
            'hidden.*' => ['string', Rule::in(self::TAB_KEYS)],
        ]);

        // overview is always first and never hidden — enforced server-side
        $order = array_values(array_unique($validated['order']));
        $order = array_values(array_filter($order, fn (string $k) => $k !== 'overview'));
        array_unshift($order, 'overview');

        $hidden = array_values(array_unique($validated['hidden'] ?? []));
        $hidden = array_values(array_filter($hidden, fn (string $k) => $k !== 'overview'));

        $project->tab_config = [
            'order' => $order,
            'hidden' => $hidden,
        ];
        $project->save();

        return redirect()->back()->with('success', 'Pořadí tabů uloženo.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->tab_config = null;
        $project->save();

        return redirect()->back()->with('success', 'Pořadí tabů obnoveno na výchozí.');
    }
}
