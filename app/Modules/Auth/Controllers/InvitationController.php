<?php

declare(strict_types=1);

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auth\Actions\InviteUser;
use App\Modules\Auth\Models\Invitation;
use App\Modules\Auth\Rules\AllowedSsoDomain;
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
            'email' => ['required', 'email', new AllowedSsoDomain, 'unique:invitations,email,NULL,id,accepted_at,NULL'],
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
        // Uniformní chyba pro neexistující / expirovanou / použitou pozvánku
        // — zabraňuje enumeraci tokenů a timing-attack rozlišení stavů.
        $genericError = 'Pozvánka je neplatná nebo její platnost vypršela.';

        $invitation = Invitation::where('token_hash', hash('sha256', $token))->first();

        if ($invitation === null || $invitation->isAccepted() || $invitation->isExpired()) {
            return redirect()->route('login')->with('error', $genericError);
        }

        // Plaintext token putujeme session → AuthenticateGoogleUser si ho
        // znova přehashuje při lookupu.
        session(['pending_invitation' => $token]);

        return redirect()->route('auth.google');
    }
}
