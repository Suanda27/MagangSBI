<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use App\Models\Plant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /api/admin/plants/{plant} — ubah nama atau status. */
class UpdatePlantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama_plant')) {
            $this->merge(['nama_plant' => trim((string) $this->input('nama_plant'))]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Plant $plant */
        $plant = $this->route('plant');

        return [
            'nama_plant' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('plants', 'nama_plant')->ignore($plant->id)],
            'status' => ['sometimes', 'required', Rule::enum(StatusAkun::class)],
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
