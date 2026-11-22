<?php

namespace App\Http\Requests\Auth;

use App\Enums\StatusAkun;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalisasi input + alias nama field dari form frontend:
     *   fullName -> name, confirmPassword -> password_confirmation,
     *   section "Assembly" -> kode "ASM" (lihat config/register.php).
     */
    protected function prepareForValidation(): void
    {
        $section = strtoupper(trim((string) $this->input('section', '')));
        $section = config('register.section_aliases')[$section] ?? $section;

        $this->merge([
            'name' => trim((string) ($this->input('name') ?? $this->input('fullName') ?? '')),
            'nik' => strtoupper(trim((string) $this->input('nik', ''))),
            'email' => strtolower(trim((string) $this->input('email', ''))),
            'section' => $section !== '' ? $section : null,
            'password_confirmation' => $this->input('password_confirmation', $this->input('confirmPassword')),
        ]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $cfg = config('register');

        $password = Password::min($cfg['password']['min']);
        if ($cfg['password']['mixed_case']) {
            $password->mixedCase();
        }
        if ($cfg['password']['numbers']) {
            $password->numbers();
        }
        if ($cfg['password']['symbols']) {
            $password->symbols();
        }

        $emailRules = ['required', 'string', 'email:rfc', 'max:255', Rule::unique('users', 'email')];
        if ($cfg['allowed_email_domains'] !== []) {
            $domains = $cfg['allowed_email_domains'];
            $emailRules[] = function (string $attribute, mixed $value, Closure $fail) use ($domains): void {
                $domain = strtolower(substr(strrchr((string) $value, '@') ?: '', 1));
                if (! in_array($domain, $domains, true)) {
                    $fail('Gunakan email resmi perusahaan ('.implode(', ', array_map(fn ($d) => '@'.$d, $domains)).').');
                }
            };
        }

        // Hanya section yang masih aktif yang boleh dipilih.
        $sectionAktif = fn (string $kolom) => Rule::exists('bagians', $kolom)->where('status', StatusAkun::Aktif->value);

        return [
            'name' => ['required', 'string', 'max:255'],
            'nik' => [
                'required', 'string', 'max:50',
                // closure + preg_match: aman untuk pola yang memuat koma / garis miring
                function (string $attribute, mixed $value, Closure $fail) use ($cfg): void {
                    $pattern = '~'.str_replace('~', '\~', $cfg['nik_pattern']).'~';
                    if (@preg_match($pattern, (string) $value) !== 1) {
                        $fail('Format NIK tidak valid.');
                    }
                },
                Rule::unique('users', 'nik'),
            ],
            'email' => $emailRules,
            // Salah satu: section (kode_bagian, mis. "IS") atau id_bagian langsung.
            'section' => ['required_without:id_bagian', 'nullable', 'string', $sectionAktif('kode_bagian')],
            'id_bagian' => ['required_without:section', 'nullable', 'integer', $sectionAktif('id')],
            'password' => ['required', 'string', 'confirmed', $password],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkap wajib diisi.',
            'nik.required' => 'NIK Karyawan wajib diisi.',
            'nik.unique' => 'NIK ini sudah terdaftar di sistem.',
            'email.required' => 'Masukkan alamat email yang valid.',
            'email.email' => 'Masukkan alamat email yang valid.',
            'email.unique' => 'Email ini sudah digunakan.',
            'section.required_without' => 'Silakan pilih section penugasan Anda.',
            'section.exists' => 'Section yang dipilih tidak tersedia.',
            'id_bagian.required_without' => 'Silakan pilih section penugasan Anda.',
            'id_bagian.exists' => 'Section yang dipilih tidak tersedia.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal :min karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ];
    }
}
