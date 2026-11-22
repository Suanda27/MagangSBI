<?php

namespace App\Http\Requests\Auth;

use App\Rules\DomainEmailDiizinkan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PATCH /api/auth/me — hanya nama, email, dan telepon (PRD 6.1).
 * NIK, role, status, dan section sengaja tidak ada di sini; field itu hanya bisa
 * diubah Admin, dan kalau terkirim akan diabaikan (validated() hanya memuat field di rules()).
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $siap = [];

        if ($this->has('name')) {
            $siap['name'] = trim((string) $this->input('name'));
        }
        if ($this->has('email')) {
            $siap['email'] = strtolower(trim((string) $this->input('email')));
        }
        if ($this->has('telepon')) {
            $telepon = trim((string) $this->input('telepon'));
            $siap['telepon'] = $telepon === '' ? null : $telepon;
        }

        $this->merge($siap);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'string', 'email:rfc', 'max:255',
                Rule::unique('users', 'email')->ignore($this->user()->id),
                new DomainEmailDiizinkan,
            ],
            'telepon' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:/^\+?[0-9\s\-().]{6,30}$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Masukkan alamat email yang valid.',
            'email.email' => 'Masukkan alamat email yang valid.',
            'email.unique' => 'Email ini sudah digunakan.',
            'telepon.regex' => 'Format nomor telepon tidak valid.',
        ];
    }
}
