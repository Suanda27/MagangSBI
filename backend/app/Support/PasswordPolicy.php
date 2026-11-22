<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

/**
 * Satu sumber kebijakan kata sandi (config/register.php), dipakai oleh registrasi
 * dan ganti kata sandi supaya aturannya selalu sama.
 */
final class PasswordPolicy
{
    public static function rule(): Password
    {
        $cfg = config('register.password');

        $rule = Password::min((int) $cfg['min']);

        if ($cfg['mixed_case']) {
            $rule->mixedCase();
        }
        if ($cfg['numbers']) {
            $rule->numbers();
        }
        if ($cfg['symbols']) {
            $rule->symbols();
        }

        return $rule;
    }
}
