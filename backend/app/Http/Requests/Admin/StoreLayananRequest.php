<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/layanan — tambah layanan pada satu section (section tujuan tiket). */
class StoreLayananRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'kode_layanan' => strtoupper(trim((string) $this->input('kode_layanan', ''))),
            'nama_layanan' => trim((string) $this->input('nama_layanan', '')),
            'kategori' => trim((string) $this->input('kategori', '')),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'kode_layanan' => ['required', 'string', 'max:20', 'regex:/^[A-Z0-9][A-Z0-9\-]*$/', Rule::unique('layanans', 'kode_layanan')],
            'nama_layanan' => [
                'required', 'string', 'max:255',
                // Nama layanan unik di dalam satu section.
                Rule::unique('layanans', 'nama_layanan')->where('id_bagian', $this->input('id_bagian')),
            ],
            'kategori' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'id_bagian' => ['required', 'integer', Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value)],
            'status' => ['sometimes', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kode_layanan.required' => 'Kode layanan wajib diisi.',
            'kode_layanan.regex' => 'Kode layanan hanya huruf besar, angka, dan tanda hubung, contoh: SRV-001.',
            'kode_layanan.unique' => 'Kode layanan ini sudah dipakai.',
            'nama_layanan.required' => 'Nama layanan wajib diisi.',
            'nama_layanan.unique' => 'Layanan dengan nama ini sudah ada pada section tersebut.',
            'kategori.required' => 'Kategori wajib diisi.',
            'id_bagian.required' => 'Section tujuan wajib dipilih.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia atau tidak aktif.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
