<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/sections — tambah section. Kode dipakai pada nomor tiket dan tidak dapat diubah lagi. */
class StoreSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'kode_bagian' => strtoupper(trim((string) $this->input('kode_bagian', ''))),
            'nama_bagian' => trim((string) $this->input('nama_bagian', '')),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'kode_bagian' => ['required', 'string', 'regex:/^[A-Z]{2,10}$/', Rule::unique('bagians', 'kode_bagian')],
            'nama_bagian' => ['required', 'string', 'max:255', Rule::unique('bagians', 'nama_bagian')],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_bagian.required' => 'Kode section wajib diisi.',
            'kode_bagian.regex' => 'Kode section 2–10 huruf tanpa spasi atau angka, contoh: GA.',
            'kode_bagian.unique' => 'Kode section ini sudah dipakai.',
            'nama_bagian.required' => 'Nama section wajib diisi.',
            'nama_bagian.unique' => 'Nama section ini sudah dipakai.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
