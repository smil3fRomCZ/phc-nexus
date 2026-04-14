<?php

declare(strict_types=1);

namespace App\Modules\Files\Actions;

use App\Models\User;
use App\Modules\Files\Models\Attachment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class UploadAttachment
{
    public function execute(
        UploadedFile $file,
        Model $attachable,
        User $uploader,
        string $disk = 'local',
    ): Attachment {
        $extension = self::sanitizeExtension($file->getClientOriginalExtension());
        $filename = Str::uuid().($extension !== '' ? '.'.$extension : '');
        $path = 'attachments/'.now()->format('Y/m').'/'.$filename;

        Storage::disk($disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
        );

        return Attachment::create([
            'attachable_type' => $attachable->getMorphClass(),
            'attachable_id' => $attachable->getKey(),
            'filename' => $filename,
            'original_filename' => self::sanitizeOriginalName($file->getClientOriginalName()),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'disk' => $disk,
            'path' => $path,
            'uploaded_by' => $uploader->id,
        ]);
    }

    /**
     * Ořez nebezpečných znaků z původního názvu:
     * - odstraní path traversal ("..", "/", "\")
     * - odstraní kontrolní znaky
     * - trim white-space, omez délku na 255 znaků
     */
    private static function sanitizeOriginalName(string $name): string
    {
        $name = basename($name); // odstraní jakoukoliv cestu
        $name = (string) preg_replace('/[\x00-\x1F\x7F]/u', '', $name); // kontrolní znaky
        $name = str_replace(['..', '/', '\\'], '_', $name);
        $name = trim($name);

        if ($name === '' || $name === '.' || $name === '_') {
            $name = 'file';
        }

        return Str::limit($name, 255, '');
    }

    /**
     * Whitelist znaků v příponě (alfanumerické + "_-", max 16 znaků).
     */
    private static function sanitizeExtension(string $ext): string
    {
        $ext = strtolower($ext);
        $ext = (string) preg_replace('/[^a-z0-9_-]/', '', $ext);

        return Str::limit($ext, 16, '');
    }
}
