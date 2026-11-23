<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/lantais — tambah lantai pada satu plant aktif. */
class StoreLantaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['nama_lantai' => trim((string) $this->input('nama_lantai', ''))]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'id_plant' => ['required', 'integer', Rule::exists('plants', 'id')->where('status', StatusAkun::Aktif->value)],
            // Nama lantai unik di dalam satu plant.
            'nama_lantai' => ['required', 'string', 'max:255', Rule::unique('lantais', 'nama_lantai')->where('id_plant', $this->input('id_plant'))],
            'status' => ['sometimes', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_plant.required' => 'Plant wajib dipilih.',
            'id_plant.exists' => 'Plant yang dipilih tidak tersedia atau tidak aktif.',
            'nama_lantai.required' => 'Nama lantai wajib diisi.',
            'nama_lantai.unique' => 'Lantai dengan nama ini sudah ada pada plant tersebut.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
