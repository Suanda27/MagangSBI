<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/plants — tambah plant. */
class StorePlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['nama_plant' => trim((string) $this->input('nama_plant', ''))]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'nama_plant' => ['required', 'string', 'max:255', Rule::unique('plants', 'nama_plant')],
            'status' => ['sometimes', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_plant.required' => 'Nama plant wajib diisi.',
            'nama_plant.unique' => 'Nama plant ini sudah dipakai.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
