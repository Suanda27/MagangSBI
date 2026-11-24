<?php

namespace App\Http\Requests\Employee;

use App\Enums\Prioritas;
use App\Enums\StatusAkun;
use App\Models\Lantai;
use App\Services\FileUploadService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi POST /api/employee/permintaan.
 * Hanya kolom di rules() yang dipakai: nomor tiket, section tujuan, PIC, dan status
 * SELALU ditentukan server, sehingga kiriman karyawan untuk kolom itu diabaikan.
 */
class StorePermintaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:employee
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $aktif = StatusAkun::Aktif->value;

        return [
            'id_layanan' => ['required', 'integer', Rule::exists('layanans', 'id')->where('status', $aktif)],
            'id_plant' => ['required', 'integer', Rule::exists('plants', 'id')->where('status', $aktif)],
            'id_lantai' => ['required', 'integer', Rule::exists('lantais', 'id')->where('status', $aktif)],
            'lokasi_detail' => ['nullable', 'string', 'max:255'],
            'judul' => ['required', 'string', 'max:150'],
            'deskripsi' => ['required', 'string', 'min:10', 'max:5000'],
            'prioritas' => ['nullable', Rule::enum(Prioritas::class)],
            ...app(FileUploadService::class)->aturan('lampiran'),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_layanan.required' => 'Layanan wajib dipilih.',
            'id_layanan.exists' => 'Layanan tidak tersedia.',
            'id_plant.required' => 'Plant wajib dipilih.',
            'id_plant.exists' => 'Plant tidak tersedia.',
            'id_lantai.required' => 'Lantai wajib dipilih.',
            'id_lantai.exists' => 'Lantai tidak tersedia.',
            'judul.required' => 'Judul permintaan wajib diisi.',
            'judul.max' => 'Judul maksimal 150 karakter.',
            'deskripsi.required' => 'Deskripsi wajib diisi.',
            'deskripsi.min' => 'Deskripsi minimal 10 karakter.',
            'deskripsi.max' => 'Deskripsi maksimal 5000 karakter.',
            'prioritas.enum' => 'Urgensi tidak valid.',
            'lampiran.max' => 'Lampiran maksimal '.FileUploadService::MAKS_BERKAS.' berkas.',
            'lampiran.*.mimes' => 'Format lampiran tidak diizinkan.',
            'lampiran.*.max' => 'Ukuran lampiran melebihi batas.',
            'lampiran.*.file' => 'Lampiran tidak valid.',
        ];
    }

    /** Lantai harus milik plant yang dipilih. */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['id_plant', 'id_lantai'])) {
                    return;
                }

                $cocok = Lantai::query()
                    ->whereKey($this->input('id_lantai'))
                    ->where('id_plant', $this->input('id_plant'))
                    ->exists();

                if (! $cocok) {
                    $validator->errors()->add('id_lantai', 'Lantai tidak termasuk dalam plant yang dipilih.');
                }
            },
        ];
    }

    /** Teks dirapikan sebelum divalidasi. */
    protected function prepareForValidation(): void
    {
        foreach (['judul', 'deskripsi', 'lokasi_detail'] as $kolom) {
            if (is_string($this->input($kolom))) {
                $this->merge([$kolom => trim($this->input($kolom))]);
            }
        }
    }
}
