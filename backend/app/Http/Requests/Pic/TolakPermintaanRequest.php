<?php

namespace App\Http\Requests\Pic;

use Illuminate\Foundation\Http\FormRequest;

/** Body POST /api/pic/permintaan/{id}/tolak. Panjang minimum alasan (10 karakter) dijaga TicketWorkflow. */
class TolakPermintaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic, hak atas tiket dijaga PermintaanPolicy
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
            'alasan.required' => 'Alasan penolakan wajib diisi.',
            'alasan.max' => 'Alasan penolakan maksimal 1000 karakter.',
        ];
    }
}
