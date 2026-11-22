<?php

/*
|--------------------------------------------------------------------------
| Konfigurasi Registrasi Akun
|--------------------------------------------------------------------------
|
| Semua aturan registrasi yang mungkin berubah ada di sini, sehingga branch
| lain (Admin, PIC, Supervisor) cukup menyesuaikan nilai/ENV tanpa menyentuh
| request, service, atau controller.
|
*/

return [

    /*
    | Role & status akun yang mendaftar sendiri. Role TIDAK PERNAH diterima dari
    | request. Nilai harus sesuai enum App\Enums\Role dan App\Enums\StatusAkun;
    | nilai tidak sah otomatis kembali ke 'employee' dan 'aktif'.
    */
    'default_role' => env('REGISTER_DEFAULT_ROLE', 'employee'),
    'default_status' => env('REGISTER_DEFAULT_STATUS', 'aktif'),

    /*
    | Daftar domain email yang diizinkan, dipisah koma (contoh: "sbi.co.id,company.com").
    | Kosong = semua domain diizinkan (praktis untuk pengembangan).
    */
    'allowed_email_domains' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('REGISTER_ALLOWED_EMAIL_DOMAINS', ''))
    ))),

    /*
    | Format NIK (regex tanpa delimiter). Bawaan menerima angka (2201xxxx)
    | maupun pola EMP-2023-0842. Ubah lewat ENV bila format NIK berbeda.
    */
    'nik_pattern' => env('REGISTER_NIK_PATTERN', '^[A-Za-z0-9][A-Za-z0-9\-\/\.]{3,30}$'),

    /*
    | Kebijakan kata sandi (selaras dengan form frontend: minimal 8 karakter).
    */
    'password' => [
        'min' => (int) env('REGISTER_PASSWORD_MIN', 8),
        'mixed_case' => (bool) env('REGISTER_PASSWORD_MIXED_CASE', false),
        'numbers' => (bool) env('REGISTER_PASSWORD_NUMBERS', false),
        'symbols' => (bool) env('REGISTER_PASSWORD_SYMBOLS', false),
    ],

    /*
    | Alias kode section dari form frontend -> bagians.kode_bagian.
    | Form mengirim "Assembly", sedangkan kodenya di database "ASM".
    | Kunci ditulis HURUF BESAR. Section lain cocok langsung dengan kode_bagian.
    */
    'section_aliases' => [
        'ASSEMBLY' => 'ASM',
    ],

    /*
    | Batas percobaan registrasi per menit per IP.
    */
    'throttle_per_minute' => (int) env('REGISTER_THROTTLE', 6),

];
