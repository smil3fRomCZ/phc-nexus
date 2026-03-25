<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auth\Actions\InviteUser;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Organization\Enums\SystemRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class InvitationController extends Controller
{
    public function store(Request $request, InviteUser $inviteUser): RedirectResponse
    {
        Gate::authorize('invite', User::class);

        $validated = $request->validate([
            'email' => ['required', 'email', 'unique:invitations,email,NULL,id,accepted_at,NULL'],
            'system_role' => ['required', 'string', 'in:'.implode(',', array_column(SystemRole::cases(), 'value'))],
            'team_id' => ['nullable', 'uuid', 'exists:teams,id'],
        ]);

        $inviteUser->execute(
            email: $validated['email'],
            role: SystemRole::from($validated['system_role']),
            teamId: $validated['team_id'] ?? null,
            invitedBy: $request->user(),
        );

        return back()->with('success', "Pozvánka odeslána na {$validated['email']}.");
    }

    public function accept(string $token): RedirectResponse
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();

        if ($invitation->isAccepted()) {
            return redirect()->route('login')->with('error', 'Tato pozvánka již byla použita.');
        }

        if ($invitation->isExpired()) {
            return redirect()->route('login')->with('error', 'Platnost pozvánky vypršela.');
        }

        session(['pending_invitation' => $invitation->token]);

        return redirect()->route('auth.google');
    }
}
