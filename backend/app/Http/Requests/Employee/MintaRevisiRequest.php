<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

/** Body POST /api/employee/permintaan/{id}/revisi. Panjang minimum alasan (10 karakter) dijaga TicketWorkflow. */
class MintaRevisiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:employee, kepemilikan dijaga PermintaanPolicy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'alasan' => ['required', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'alasan.required' => 'Alasan revisi wajib diisi.',
            'alasan.max' => 'Alasan revisi maksimal 1000 karakter.',
        ];
    }
}
