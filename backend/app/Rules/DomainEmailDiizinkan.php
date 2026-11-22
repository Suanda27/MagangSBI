<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Membatasi email ke domain perusahaan (config/register.php: allowed_email_domains).
 * Daftar kosong = semua domain diizinkan. Dipakai saat registrasi dan ubah profil.
 */
class DomainEmailDiizinkan implements ValidationRule
{
    /** @param  list<string>|null  $domains  null = ambil dari konfigurasi */
    public function __construct(private readonly ?array $domains = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $domains = $this->domains ?? config('register.allowed_email_domains', []);

        if ($domains === []) {
            return;
        }

        $domain = strtolower(substr(strrchr((string) $value, '@') ?: '', 1));

        if (! in_array($domain, $domains, true)) {
            $fail('Gunakan email resmi perusahaan ('.implode(', ', array_map(fn ($d) => '@'.$d, $domains)).').');
        }
    }
}
