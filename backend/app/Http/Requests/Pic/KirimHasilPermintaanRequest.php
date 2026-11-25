<?php

namespace App\Http\Requests\Pic;

use App\Services\FileUploadService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Body POST /api/pic/permintaan/{id}/kirim-hasil (multipart): catatan opsional dan 1–5 bukti.
 * Jenis, ukuran, dan jumlah berkas mengikuti pengaturan Admin yang sama dengan lampiran pengajuan.
 */
class KirimHasilPermintaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic, hak atas tiket dijaga PermintaanPolicy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'catatan' => ['nullable', 'string', 'max:2000'],
            ...app(FileUploadService::class)->aturan('bukti'),
            'bukti' => ['required', 'array', 'min:1', 'max:'.FileUploadService::MAKS_BERKAS],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'catatan.max' => 'Catatan hasil maksimal 2000 karakter.',
            'bukti.required' => 'Lampirkan minimal 1 bukti hasil kerja.',
            'bukti.min' => 'Lampirkan minimal 1 bukti hasil kerja.',
            'bukti.max' => 'Bukti maksimal '.FileUploadService::MAKS_BERKAS.' berkas.',
            'bukti.*.mimes' => 'Format bukti harus '.implode(', ', app(FileUploadService::class)->formatDiizinkan()).'.',
            'bukti.*.max' => 'Ukuran setiap bukti maksimal '.app(FileUploadService::class)->batasMb().' MB.',
        ];
    }
}
