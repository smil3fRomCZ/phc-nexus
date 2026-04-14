<?php

declare(strict_types=1);

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnforceSecurityStamp;
use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Organization\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    public function uploadAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=128,min_height=128'],
        ]);

        $user = $request->user();

        // Smazat starý upload
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update([
            'avatar_path' => $path,
        ]);

        return redirect()->back()
            ->with('success', 'Avatar aktualizován.');
    }

    /**
     * Zregeneruje security_stamp uživatele a aktualizuje ho v aktuální
     * session — všechny ostatní sessions dostanou při dalším requestu
     * mismatch a odhlásí se přes EnforceSecurityStamp middleware.
     */
    public function logoutEverywhere(Request $request, AuditService $audit): RedirectResponse
    {
        $user = $request->user();
        $newStamp = bin2hex(random_bytes(16));

        $user->forceFill(['security_stamp' => $newStamp])->save();
        $request->session()->put(EnforceSecurityStamp::SESSION_KEY, $newStamp);

        $audit->log(
            AuditAction::Updated,
            $user,
            payload: ['operation' => 'logout_other_devices'],
        );

        return redirect()->back()
            ->with('success', 'Odhlášení na ostatních zařízeních bylo vyžádáno.');
    }

    public function removeAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->update([
            'avatar_path' => null,
        ]);

        return redirect()->back()
            ->with('success', 'Avatar odstraněn.');
    }
}
