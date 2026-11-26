<?php

namespace App\Http\Requests\Supervisor;

use App\Http\Requests\Admin\LaporanAdminRequest;

/**
 * Filter Laporan Supervisor: ?dari=&sampai=&status=&layanan=&page=&per_page=
 *
 * Memakai aturan dan kueri Laporan Admin (LaporanTiket) apa adanya, tetapi cakupannya DIKUNCI ke section
 * supervisor (aturan A1): id_bagian selalu diisi dari akun yang masuk, dan filter yang tidak berlaku bagi
 * supervisor (id_bagian, id_pic, id_plant, id_layanan dari klien) dibuang sebelum divalidasi, sehingga klien
 * tidak bisa melebarkan cakupannya. Filter layanan memakai nama `layanan`, sama dengan halaman Monitoring.
 */
class LaporanSupervisorRequest extends LaporanAdminRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'layanan' => ['nullable', 'integer', 'min:1'],
            // Diisi server dari akun; 0 berarti akun tanpa section (laporan kosong), jadi tidak ditolak.
            'id_bagian' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'layanan.integer' => 'Layanan tidak valid.',
        ]);
    }

    protected function prepareForValidation(): void
    {
        // LaporanTiket membaca nilai lewat query(), jadi kunci cakupan ditulis ke bag query, bukan hanya input.
        foreach (['id_bagian', 'id_pic', 'id_plant', 'id_layanan'] as $dibuang) {
            $this->query->remove($dibuang);
            $this->request->remove($dibuang);
        }

        // id_bagian 0 tidak cocok dengan section mana pun: akun tanpa section mendapat laporan kosong.
        $this->query->set('id_bagian', (string) (int) $this->user()?->id_bagian);

        if ($this->filled('layanan') && ctype_digit((string) $this->query('layanan'))) {
            $this->query->set('id_layanan', (string) $this->query('layanan'));
        }
    }
}
