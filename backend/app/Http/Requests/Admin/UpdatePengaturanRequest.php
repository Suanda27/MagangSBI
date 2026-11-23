<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** PATCH /api/admin/pengaturan — batas ukuran dan format lampiran (PRD D11). */
class UpdatePengaturanRequest extends FormRequest
{
    /** Format yang boleh diizinkan; PRD membatasi lampiran ke JPG, PNG, dan PDF. */
    public const FORMAT_DIIZINKAN = ['jpg', 'png', 'pdf'];

    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        if (is_array($this->input('format_lampiran'))) {
            $this->merge([
                'format_lampiran' => array_map(
                    fn ($f) => is_string($f) ? strtolower(trim($f)) : $f,
                    $this->input('format_lampiran'),
                ),
            ]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // Batas sistem 5 MB (PRD); Admin hanya boleh menurunkannya, tidak menaikkannya di atas 5.
            'max_upload_mb' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'format_lampiran' => ['sometimes', 'required', 'array', 'min:1'],
            'format_lampiran.*' => ['string', 'distinct', 'in:'.implode(',', self::FORMAT_DIIZINKAN)],
            // Hanya dibaca: format nomor tiket tetap {KODE}-{TAHUN}-{URUTAN 4 digit}.
            'digit_nomor_tiket' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'max_upload_mb.required' => 'Ukuran maksimal wajib diisi.',
            'max_upload_mb.integer' => 'Ukuran maksimal harus berupa angka bulat (MB).',
            'max_upload_mb.between' => 'Ukuran maksimal 1–5 MB (batas sistem 5 MB).',
            'format_lampiran.required' => 'Pilih minimal satu format berkas.',
            'format_lampiran.array' => 'Format berkas harus berupa daftar.',
            'format_lampiran.min' => 'Pilih minimal satu format berkas.',
            'format_lampiran.*.in' => 'Format yang diizinkan hanya jpg, png, dan pdf.',
            'format_lampiran.*.distinct' => 'Format berkas tidak boleh diulang.',
            'digit_nomor_tiket.prohibited' => 'Format nomor tiket tetap dan tidak dapat diubah.',
        ];
    }
}
