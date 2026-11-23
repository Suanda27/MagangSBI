<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PATCH /api/admin/sections/{bagian} — ubah nama, deskripsi, atau status. Kode tidak dapat diubah. */
class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('nama_bagian')) {
            $this->merge(['nama_bagian' => trim((string) $this->input('nama_bagian'))]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Bagian $bagian */
        $bagian = $this->route('bagian');

        return [
            // Kode sudah tertulis pada nomor tiket yang terbit, jadi dikunci.
            'kode_bagian' => ['prohibited'],
            'nama_bagian' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('bagians', 'nama_bagian')->ignore($bagian->id)],
            'deskripsi' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'required', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_bagian.prohibited' => 'Kode section tidak dapat diubah karena sudah dipakai pada nomor tiket.',
            'nama_bagian.required' => 'Nama section wajib diisi.',
            'nama_bagian.unique' => 'Nama section ini sudah dipakai.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
