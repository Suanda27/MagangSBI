<?php

namespace App\Http\Requests\Pic;

use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Query GET /api/pic/permintaan: ?tab=masuk|diproses|selesai&status=&prioritas=&q=&layanan=&page=&per_page= */
class DaftarPermintaanPicRequest extends FormRequest
{
    public const TAB_MASUK = 'masuk';

    public const TAB_DIPROSES = 'diproses';

    public const TAB_SELESAI = 'selesai';

    public const PER_PAGE_BAWAAN = 10;

    public const PER_PAGE_MAKS = 50;

    /** Status yang boleh muncul di tiap tab. */
    public const STATUS_TAB = [
        self::TAB_MASUK => ['submitted'],
        self::TAB_DIPROSES => ['in_progress', 'pending', 'waiting_review'],
        self::TAB_SELESAI => ['completed', 'rejected'],
    ];

    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tab' => ['nullable', Rule::in(array_keys(self::STATUS_TAB))],
            'status' => ['nullable', 'string', 'max:100'],
            'prioritas' => ['nullable', Rule::in(array_column(Prioritas::cases(), 'value'))],
            'q' => ['nullable', 'string', 'max:100'],
            'layanan' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAKS],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'tab.in' => 'Tab tidak valid. Pilih: masuk, diproses, atau selesai.',
            'prioritas.in' => 'Prioritas tidak valid.',
            'layanan.integer' => 'Layanan tidak valid.',
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

    public function tab(): string
    {
        return (string) ($this->query('tab') ?: self::TAB_MASUK);
    }

    /** @return list<string> status yang diminta, mis. "pending,in_progress" -> ['pending', 'in_progress'] */
    public function statuses(): array
    {
        $mentah = (string) $this->query('status', '');

        return array_values(array_unique(array_filter(array_map('trim', explode(',', $mentah)), fn ($s) => $s !== '')));
    }

    /** @return list<string> status efektif untuk query: irisan permintaan dengan status milik tab. */
    public function statusEfektif(): array
    {
        $milikTab = self::STATUS_TAB[$this->tab()] ?? [];
        $diminta = $this->statuses();

        return $diminta === [] ? $milikTab : array_values(array_intersect($milikTab, $diminta));
    }

    public function kataKunci(): string
    {
        return trim((string) $this->query('q', ''));
    }

    public function perPage(): int
    {
        return (int) ($this->query('per_page') ?: self::PER_PAGE_BAWAAN);
    }
}
