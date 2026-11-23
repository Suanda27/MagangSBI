<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Rules\DomainEmailDiizinkan;
use App\Rules\FormatNik;
use App\Support\PasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /api/admin/users — Admin membuat akun dan menetapkan perannya (PRD D9). */
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'nik' => strtoupper(trim((string) $this->input('nik', ''))),
            'email' => strtolower(trim((string) $this->input('email', ''))),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $bagianAktif = Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value);

        return [
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'string', 'max:50', new FormatNik, Rule::unique('users', 'nik')],
            'email' => ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email'), new DomainEmailDiizinkan],
            'password' => ['required', 'string', 'confirmed', PasswordPolicy::rule()],
            'role' => ['required', Rule::enum(Role::class)],
            // Karyawan, Supervisor, dan PIC wajib terikat ke satu section; Admin tidak punya section.
            'id_bagian' => [
                'nullable', 'integer', $bagianAktif,
                Rule::requiredIf(fn () => in_array($this->input('role'), [Role::Employee->value, Role::Supervisor->value, Role::Pic->value], true)),
                'prohibited_if:role,'.Role::Admin->value,
            ],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'telepon' => ['nullable', 'string', 'max:30'],
            'status' => ['sometimes', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'nik.required' => 'NIK wajib diisi.',
            'nik.unique' => 'NIK ini sudah terdaftar di sistem.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Masukkan alamat email yang valid.',
            'email.unique' => 'Email ini sudah digunakan.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'role.required' => 'Peran wajib dipilih.',
            'role.enum' => 'Peran tidak valid.',
            'id_bagian.required' => 'Section wajib dipilih untuk peran ini.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia atau tidak aktif.',
            'id_bagian.prohibited_if' => 'Administrator tidak terikat ke section.',
        ];
    }
}
