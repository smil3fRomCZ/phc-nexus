<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Organization\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $user->load('team:id,name');

        // Direct reports: users in teams where this user is team lead
        $directReports = User::query()
            ->whereIn('team_id', Team::where('team_lead_id', $user->id)->select('id'))
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'system_role', 'status', 'job_title', 'team_id'])
            ->load('team:id,name');

        return Inertia::render('Profile/Index', [
            'user' => $user,
            'directReports' => $directReports,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $request->user()->update($validated);

        return redirect()->back()
            ->with('success', 'Profil aktualizován.');
    }
}
