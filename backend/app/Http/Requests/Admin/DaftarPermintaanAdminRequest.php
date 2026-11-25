<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusPermintaan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/** Query GET /api/admin/permintaan: ?status=&id_bagian=&id_plant=&q=&page=&per_page= */
class DaftarPermintaanAdminRequest extends FormRequest
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
            'status' => ['nullable', 'string', 'max:100'],
            'id_bagian' => ['nullable', 'integer', 'min:1'],
            'id_plant' => ['nullable', 'integer', 'min:1'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAKS],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_bagian.integer' => 'Section tidak valid.',
            'id_plant.integer' => 'Plant tidak valid.',
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

    public function kataKunci(): string
    {
        return trim((string) $this->query('q', ''));
    }

    public function perPage(): int
    {
        return (int) ($this->query('per_page') ?: self::PER_PAGE_BAWAAN);
    }
}
