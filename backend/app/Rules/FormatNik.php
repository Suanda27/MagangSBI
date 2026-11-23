<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Format NIK menurut config/register.php (nik_pattern), dipakai formulir Admin.
 * Pola yang sama dengan registrasi mandiri supaya NIK dari kedua jalur selalu seragam.
 */
class FormatNik implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $pola = '~'.str_replace('~', '\~', (string) config('register.nik_pattern')).'~';

        if (@preg_match($pola, (string) $value) !== 1) {
            $fail('Format NIK tidak valid.');
        }
    }
}
