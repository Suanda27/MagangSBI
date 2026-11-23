<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class LoginRequest extends FormRequest
{
    /** PRD 6.1: login dibatasi 5 percobaan per menit. */
    public const MAKS_PERCOBAAN = 5;

    public const DETIK_BLOKIR = 60;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['login' => trim((string) $this->input('login', ''))]);
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'login.required' => 'NIK atau email wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
        ];
    }

    /**
     * Cocokkan akun (NIK atau email) dan buka sesi.
     *
     * @throws ValidationException bila kredensial salah
     * @throws TooManyRequestsHttpException bila percobaan melebihi batas
     */
    public function authenticate(): void
    {
        $this->pastikanTidakTerblokir();

        $login = (string) $this->input('login');
        // "@" berarti email (huruf kecil); selain itu NIK (disimpan huruf besar saat registrasi).
        $kredensial = str_contains($login, '@')
            ? ['email' => strtolower($login)]
            : ['nik' => strtoupper($login)];

        $berhasil = Auth::guard('web')->attempt(
            $kredensial + ['password' => (string) $this->input('password')],
            $this->boolean('remember'),
        );

        if (! $berhasil) {
            RateLimiter::hit($this->kunciPembatas(), self::DETIK_BLOKIR);

            // Pesan sama untuk "akun tidak ada" dan "sandi salah" agar akun tidak bisa ditebak.
            throw ValidationException::withMessages([
                'login' => 'NIK/Email atau kata sandi tidak valid.',
            ]);
        }

        RateLimiter::clear($this->kunciPembatas());
    }

    private function pastikanTidakTerblokir(): void
    {
        if (! RateLimiter::tooManyAttempts($this->kunciPembatas(), self::MAKS_PERCOBAAN)) {
            return;
        }

        event(new Lockout($this));

        $detik = RateLimiter::availableIn($this->kunciPembatas());

        throw new TooManyRequestsHttpException(
            $detik,
            "Terlalu banyak percobaan masuk. Coba lagi dalam {$detik} detik.",
        );
    }

    /** Pembatas per kombinasi akun yang dicoba + alamat IP. */
    private function kunciPembatas(): string
    {
        return Str::transliterate(Str::lower((string) $this->input('login')).'|'.$this->ip());
    }
}
