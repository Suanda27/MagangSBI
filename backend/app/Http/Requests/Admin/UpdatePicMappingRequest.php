<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /api/admin/pic-mapping/{user} — pindahkan PIC ke section lain. */
class UpdatePicMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_bagian' => ['required', 'integer', Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_bagian.required' => 'Section tujuan wajib dipilih.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia atau tidak aktif.',
        ];
    }
}
