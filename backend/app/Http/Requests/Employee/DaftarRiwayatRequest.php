<?php

namespace App\Http\Requests\Employee;

use Carbon\CarbonImmutable;

/**
 * Query GET /api/employee/riwayat: ?status=&bulan=&q=&layanan=&page=&per_page=
 * Memakai aturan daftar permintaan (status, q, layanan, paginasi) ditambah bulan "YYYY-MM".
 */
class DaftarRiwayatRequest extends DaftarPermintaanRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'bulan' => ['nullable', 'string', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ]);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'bulan.regex' => 'Format bulan harus YYYY-MM, misalnya 2026-11.',
        ]);
    }

    /** Awal dan akhir bulan yang diminta (zona waktu aplikasi), atau null bila tidak difilter. */
    public function rentangBulan(): ?array
    {
        $bulan = (string) $this->query('bulan', '');

        if ($bulan === '') {
            return null;
        }

        $awal = CarbonImmutable::createFromFormat('!Y-m', $bulan)->startOfMonth();

        return [$awal, $awal->endOfMonth()];
    }
}
