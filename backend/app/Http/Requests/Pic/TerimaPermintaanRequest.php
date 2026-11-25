<?php

namespace App\Http\Requests\Pic;

use Illuminate\Foundation\Http\FormRequest;

/** Body POST /api/pic/permintaan/{id}/terima. Catatan awal bersifat opsional. */
class TerimaPermintaanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // peran dijaga middleware role:pic, hak atas tiket dijaga PermintaanPolicy
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'catatan.max' => 'Catatan maksimal 1000 karakter.',
        ];
    }
}
