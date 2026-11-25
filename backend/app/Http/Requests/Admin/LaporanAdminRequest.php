<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusPermintaan;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Filter Laporan Admin: ?dari=&sampai=&id_bagian=&id_layanan=&id_pic=&id_plant=&status=&page=&per_page=
 * Rentang tanggal mengacu pada tanggal pengajuan tiket, termasuk seluruh hari "sampai".
 */
class LaporanAdminRequest extends FormRequest
{
    public const PER_PAGE_BAWAAN = 15;

    public const PER_PAGE_MAKS = 100;

    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:admin
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'dari' => ['nullable', 'date_format:Y-m-d'],
            'sampai' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:dari'],
            'id_bagian' => ['nullable', 'integer', 'min:1'],
            'id_layanan' => ['nullable', 'integer', 'min:1'],
            'id_pic' => ['nullable', 'integer', 'min:1'],
            'id_plant' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAKS],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'dari.date_format' => 'Tanggal awal harus berformat YYYY-MM-DD.',
            'sampai.date_format' => 'Tanggal akhir harus berformat YYYY-MM-DD.',
            'sampai.after_or_equal' => 'Tanggal akhir tidak boleh sebelum tanggal awal.',
            'per_page.max' => 'per_page maksimal '.self::PER_PAGE_MAKS.'.',
        ];
    }

    /** Setiap nilai status (dipisah koma) harus salah satu dari 6 status PRD. */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $tidakValid = array_diff($this->statuses(), array_column(StatusPermintaan::cases(), 'value'));

                if ($tidakValid !== []) {
                    $validator->errors()->add('status', 'Status tidak valid: '.implode(', ', $tidakValid).'.');
                }
            },
        ];
    }

    /** @return list<string> */
    public function statuses(): array
    {
        $mentah = (string) $this->query('status', '');

        return array_values(array_unique(array_filter(array_map('trim', explode(',', $mentah)), fn ($s) => $s !== '')));
    }

    public function dari(): ?CarbonImmutable
    {
        return $this->filled('dari') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $this->query('dari'))->startOfDay() : null;
    }

    public function sampai(): ?CarbonImmutable
    {
        return $this->filled('sampai') ? CarbonImmutable::createFromFormat('Y-m-d', (string) $this->query('sampai'))->endOfDay() : null;
    }

    public function perPage(): int
    {
        return (int) ($this->query('per_page') ?: self::PER_PAGE_BAWAAN);
    }
}
