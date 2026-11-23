<?php

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\User;
use App\Rules\DomainEmailDiizinkan;
use App\Rules\FormatNik;
use App\Support\PasswordPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * PATCH /api/admin/users/{user} — ubah data, peran, section, status, atau reset kata sandi.
 * Semua field opsional; yang tidak dikirim tidak berubah. Akun tidak dihapus, hanya dinonaktifkan.
 */
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // hak akses dijaga middleware role:admin pada routes/api.php
    }

    protected function prepareForValidation(): void
    {
        $normal = [];
        if ($this->has('name')) {
            $normal['name'] = trim((string) $this->input('name'));
        }
        if ($this->has('nik')) {
            $normal['nik'] = strtoupper(trim((string) $this->input('nik')));
        }
        if ($this->has('email')) {
            $normal['email'] = strtolower(trim((string) $this->input('email')));
        }
        $this->merge($normal);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var User $target */
        $target = $this->route('user');
        $bagianAktif = Rule::exists('bagians', 'id')->where('status', StatusAkun::Aktif->value);

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'nik' => ['sometimes', 'required', 'string', 'max:50', new FormatNik, Rule::unique('users', 'nik')->ignore($target->id)],
            'email' => ['sometimes', 'required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($target->id), new DomainEmailDiizinkan],
            // Reset kata sandi oleh Admin; kosongkan field ini bila tidak ingin mengubahnya.
            'password' => ['sometimes', 'string', 'confirmed', PasswordPolicy::rule()],
            'role' => ['sometimes', 'required', Rule::enum(Role::class)],
            'id_bagian' => ['sometimes', 'nullable', 'integer', $bagianAktif],
            'jabatan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telepon' => ['sometimes', 'nullable', 'string', 'max:30'],
            'status' => ['sometimes', 'required', Rule::enum(StatusAkun::class)],
        ];
    }

    /**
     * Aturan lintas field, dihitung dari kondisi AKHIR setelah perubahan diterapkan.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            /** @var User $target */
            $target = $this->route('user');

            $role = $this->has('role') ? Role::tryFrom((string) $this->input('role')) : $target->role;
            $idBagian = $this->has('id_bagian') ? $this->input('id_bagian') : $target->id_bagian;
            $status = $this->has('status') ? StatusAkun::tryFrom((string) $this->input('status')) : $target->status;

            if ($role === null || $status === null) {
                return; // sudah ditangani aturan enum di atas
            }

            if ($role === Role::Admin && $idBagian !== null && $this->has('id_bagian')) {
                $validator->errors()->add('id_bagian', 'Administrator tidak terikat ke section.');
            }

            if ($role !== Role::Admin && $idBagian === null) {
                $validator->errors()->add('id_bagian', 'Section wajib dipilih untuk peran ini.');
            }

            // Admin tidak boleh mengunci dirinya sendiri dari sistem.
            if ($this->user()?->is($target)) {
                if ($role !== Role::Admin) {
                    $validator->errors()->add('role', 'Anda tidak dapat mengubah peran akun Anda sendiri.');
                }
                if ($status !== StatusAkun::Aktif) {
                    $validator->errors()->add('status', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
                }
            }
        }];
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
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'role.enum' => 'Peran tidak valid.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia atau tidak aktif.',
            'status.enum' => 'Status tidak valid.',
        ];
    }
}
