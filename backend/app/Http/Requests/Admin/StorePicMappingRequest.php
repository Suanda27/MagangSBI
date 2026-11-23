<?php

namespace App\Http\Requests\Admin;

use App\Enums\StatusAkun;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/pic-mapping — tetapkan karyawan sebagai PIC di satu section. */
class StorePicMappingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'integer', Rule::exists('users', 'id'),
                function (string $attribute, mixed $value, Closure $fail): void {
                    $user = User::find($value);
                    if ($user === null) {
                        return; // ditangani aturan exists
                    }
                    if ($user->isPic()) {
                        $fail('Pengguna ini sudah menjadi PIC. Ubah section lewat PATCH /api/admin/pic-mapping/{id}.');
                    } elseif (! $user->isEmployee()) {
                        $fail('Hanya karyawan yang dapat ditetapkan sebagai PIC.');
                    } elseif (! $user->isAktif()) {
                        $fail('Akun karyawan ini nonaktif. Aktifkan terlebih dahulu.');
                    }
                },
            ],
            'id_bagian' => ['required', 'integer', Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'Karyawan wajib dipilih.',
            'user_id.exists' => 'Karyawan tidak ditemukan.',
            'id_bagian.required' => 'Section wajib dipilih.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia atau tidak aktif.',
        ];
    }
}
