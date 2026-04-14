<?php

declare(strict_types=1);

namespace App\Modules\Auth\Mail;

use App\Modules\Auth\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class InvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Invitation $invitation,
    ) {
        $this->onQueue('mail');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pozvánka do PHC Nexus',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.invitation',
            with: [
                'acceptUrl' => url("/auth/invite/{$this->invitation->token}"),
                'invitedBy' => $this->invitation->invitedBy->name,
                'expiresAt' => $this->invitation->expires_at->format('d.m.Y H:i'),
            ],
        );
    }
}
