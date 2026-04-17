<?php

declare(strict_types=1);

namespace App\Modules\Files\Support;

/**
 * Sdílená validační pravidla pro upload příloh.
 * Používá se ve všech *AttachmentController::store().
 */
final class AttachmentValidation
{
    /**
     * @return array<int, mixed>
     */
    public static function fileRules(): array
    {
        return [
            'required',
            'file',
            'max:'.config('attachments.max_size_kb'),
            'mimetypes:'.implode(',', config('attachments.allowed_mime_types')),
        ];
    }

    /**
     * Pravidla pro wiki inline obrázky. Whitelist je záměrně užší než
     * fileRules — nezahrnuje svg (XSS vektor při same-origin embedu).
     *
     * @return array<int, mixed>
     */
    public static function imageRules(): array
    {
        return [
            'required',
            'file',
            'max:'.config('attachments.max_image_size_kb'),
            'mimetypes:'.implode(',', config('attachments.allowed_image_mime_types')),
        ];
    }
}
