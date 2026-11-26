<?php

namespace App\Http\Requests\Pic;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Filter Laporan PIC: ?dari=&sampai=&id_bagian_pengaju=
 * Rentang tanggal mengacu pada tanggal pengajuan tiket (kedua hari ikut dihitung).
 * id_bagian_pengaju = section asal karyawan pengaju.
 */
class LaporanPicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'dari' => ['nullable', 'date_format:Y-m-d'],
            'sampai' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:dari'],
            'id_bagian_pengaju' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'dari.date_format' => 'Tanggal awal harus berformat YYYY-MM-DD.',
            'sampai.date_format' => 'Tanggal akhir harus berformat YYYY-MM-DD.',
            'sampai.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal awal.',
            'id_bagian_pengaju.integer' => 'Section pengaju tidak valid.',
        ];
    }

    public function dari(): ?CarbonImmutable
    {
        return $this->filled('dari') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $this->query('dari'))->startOfDay() : null;
    }

    public function sampai(): ?CarbonImmutable
    {
        return $this->filled('sampai') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $this->query('sampai'))->endOfDay() : null;
    }
}
