<?php

namespace App\Http\Requests\Supervisor;

use App\Services\EksporTiket;
use Illuminate\Validation\Rule;

/**
 * Ekspor Laporan Supervisor: filter yang sama dengan laporan (dan cakupan section yang sama terkunci),
 * ditambah ?format=csv|excel|pdf. Paginasi tidak dipakai: ekspor selalu memuat SELURUH hasil filter.
 */
class EksporSupervisorRequest extends LaporanSupervisorRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'format' => ['required', 'string', Rule::in(EksporTiket::FORMAT)],
        ]);
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return array_merge(parent::messages(), [
            'format.required' => 'Format ekspor wajib diisi (csv, excel, atau pdf).',
            'format.in' => 'Format ekspor harus csv, excel, atau pdf.',
        ]);
    }
}
