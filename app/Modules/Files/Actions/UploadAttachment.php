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
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
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
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size' => $file->getSize(),
            'disk' => $disk,
            'path' => $path,
            'uploaded_by' => $uploader->id,
        ]);
    }
}
