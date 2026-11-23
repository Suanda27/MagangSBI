<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use App\Models\Layanan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/admin/layanan/{layanan} — ubah data, pindah section, atau nonaktifkan.
 * Tiket yang sudah terbit menyimpan section tujuannya sendiri, jadi memindahkan layanan
 * hanya memengaruhi tiket berikutnya.
 */
class UpdateLayananRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $normal = [];
        foreach (['nama_layanan', 'kategori'] as $kolom) {
            if ($this->has($kolom)) {
                $normal[$kolom] = trim((string) $this->input($kolom));
            }
        }
        if ($this->has('kode_layanan')) {
            $normal['kode_layanan'] = strtoupper(trim((string) $this->input('kode_layanan')));
        }
        $this->merge($normal);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Layanan $layanan */
        $layanan = $this->route('layanan');
        $idBagian = $this->has('id_bagian') ? $this->input('id_bagian') : $layanan->id_bagian;

        return [
            'kode_layanan' => ['sometimes', 'required', 'string', 'max:20', 'regex:/^[A-Z0-9][A-Z0-9\-]*$/', Rule::unique('layanans', 'kode_layanan')->ignore($layanan->id)],
            'nama_layanan' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('layanans', 'nama_layanan')->where('id_bagian', $idBagian)->ignore($layanan->id),
            ],
            'kategori' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'id_bagian' => ['sometimes', 'required', 'integer', Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value)],
            'status' => ['sometimes', 'required', Rule::enum(StatusAkun::class)],
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
