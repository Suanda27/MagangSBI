<?php

namespace App\Http\Requests\Supervisor;

use App\Http\Requests\Employee\DaftarPermintaanRequest;
use Carbon\CarbonImmutable;

/**
 * Query GET /api/supervisor/permintaan: ?status=&layanan=&dari=&sampai=&q=&page=&per_page=
 * Memakai aturan daftar permintaan (status, layanan, q, paginasi) ditambah rentang tanggal pengajuan.
 * Format dan perilaku tanggal sama dengan Laporan Admin: Y-m-d, dan "sampai" mencakup seluruh harinya.
 */
class DaftarPermintaanSupervisorRequest extends DaftarPermintaanRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'dari' => ['nullable', 'date_format:Y-m-d'],
            'sampai' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:dari'],
        ]);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'dari.date_format' => 'Tanggal awal harus berformat YYYY-MM-DD.',
            'sampai.date_format' => 'Tanggal akhir harus berformat YYYY-MM-DD.',
            'sampai.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal awal.',
        ]);
    }

    public function dari(): ?CarbonImmutable
    {
        return $this->filled('dari') ? CarbonImmutable::createFromFormat('!Y-m-d', (string) $this->query('dari'))->startOfDay() : null;
    }

    public function sampai(): ?CarbonImmutable
    {
        return $this->filled('sampai') ? CarbonImmutable::createFromFormat('!Y-m-d', (string) $this->query('sampai'))->endOfDay() : null;
    }
}
