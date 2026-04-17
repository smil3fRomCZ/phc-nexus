<?php

declare(strict_types=1);

namespace App\Modules\Files\Actions;

use App\Models\Concerns\HasPhiClassification;
use App\Models\User;
use App\Modules\Audit\AuditService;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\PhiAccessGuard;
use App\Modules\Files\Models\Attachment;
use App\Modules\Wiki\Models\WikiPage;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class DownloadAttachment
{
    public function __construct(
        private readonly PhiAccessGuard $phiGuard,
        private readonly AuditService $auditService,
    ) {}

    /**
     * @throws AuthorizationException
     */
    public function execute(Attachment $attachment, User $user): StreamedResponse
    {
        $attachable = $attachment->attachable;

        if ($attachable === null) {
            throw new AuthorizationException('Nemáte oprávnění stahovat tuto přílohu.');
        }

        $this->authorizeView($user, $attachable);

        if ($this->hasPhiTrait($attachable) && ! $this->phiGuard->canAccess($user, $attachable)) {
            throw new AuthorizationException('Nemáte oprávnění stahovat přílohy PHI entity.');
        }

        // HIPAA-like audit trail: bez kontextu jsme neviděli k jaké entitě patří.
        $this->auditService->log(AuditAction::Downloaded, $attachment, [
            'filename' => $attachment->original_filename,
            'mime_type' => $attachment->mime_type,
            'size' => $attachment->size,
            'attachable_type' => $attachment->attachable_type,
            'attachable_id' => $attachment->attachable_id,
        ]);

        return response()->streamDownload(
            function () use ($attachment) {
                echo file_get_contents($attachment->getFullPath());
            },
            $attachment->original_filename,
            ['Content-Type' => $attachment->mime_type],
        );
    }

    /**
     * WikiPage nemá vlastní Policy — autorizujeme přes rodičovský Project.
     * Ostatní (Task, Epic, Project, Comment) mají `view` ability v Policy.
     *
     * @throws AuthorizationException
     */
    private function authorizeView(User $user, Model $attachable): void
    {
        $target = $attachable instanceof WikiPage
            ? $attachable->project
            : $attachable;

        if ($target === null || ! $user->can('view', $target)) {
            throw new AuthorizationException('Nemáte oprávnění stahovat tuto přílohu.');
        }
    }

    private function hasPhiTrait(object $model): bool
    {
        return in_array(HasPhiClassification::class, class_uses_recursive($model));
    }
}
