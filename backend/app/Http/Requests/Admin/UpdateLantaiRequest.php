<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use App\Models\Lantai;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/admin/lantais/{lantai} — ubah nama atau status.
 * Plant tidak dapat dipindah: tiket lama menyimpan pasangan plant dan lantai, jadi memindahkan
 * lantai ke plant lain akan membuat lokasi tiket lama tidak konsisten.
 */
class UpdateLantaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama_lantai')) {
            $this->merge(['nama_lantai' => trim((string) $this->input('nama_lantai'))]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Lantai $lantai */
        $lantai = $this->route('lantai');

        return [
            'id_plant' => ['prohibited'],
            'nama_lantai' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('lantais', 'nama_lantai')->where('id_plant', $lantai->id_plant)->ignore($lantai->id)],
            'status' => ['sometimes', 'required', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_plant.prohibited' => 'Lantai tidak dapat dipindah ke plant lain. Buat lantai baru di plant tujuan.',
            'nama_lantai.required' => 'Nama lantai wajib diisi.',
            'nama_lantai.unique' => 'Lantai dengan nama ini sudah ada pada plant tersebut.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
