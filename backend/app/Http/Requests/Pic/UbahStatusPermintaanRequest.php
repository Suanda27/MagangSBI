<?php

namespace App\Http\Requests\Pic;

use App\Enums\StatusPermintaan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Body POST /api/pic/permintaan/{id}/status.
 * Hanya dua tujuan: pending (tunda, alasan wajib) atau in_progress (lanjutkan). Panjang minimum alasan
 * (5 karakter) dan keabsahan transisi dijaga TicketWorkflow.
 */
class UbahStatusPermintaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic, hak atas tiket dijaga PermintaanPolicy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([StatusPermintaan::Pending->value, StatusPermintaan::InProgress->value])],
            'alasan' => ['nullable', 'required_if:status,'.StatusPermintaan::Pending->value, 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'status.required' => 'Status tujuan wajib diisi.',
            'status.in' => 'Status tujuan hanya boleh pending atau in_progress.',
            'alasan.required_if' => 'Alasan penundaan wajib diisi.',
            'alasan.max' => 'Alasan maksimal 1000 karakter.',
        ];
    }
}
