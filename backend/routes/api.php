<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Route API
|--------------------------------------------------------------------------
|
| Semua route di sini otomatis berawalan /api. Route dipecah per peran ke
| folder routes/api/ agar Faiz dan Syifa tidak berebut satu file saat merge.
|
| Hak akses dipasang di SINI, per kelompok, supaya tidak ada route peran yang
| terlewat lupa dilindungi:
|   auth:sanctum   → harus sudah login
|   akun.aktif     → akun tidak boleh nonaktif
|   role:<peran>   → hanya peran tersebut (employee, supervisor, pic, admin)
|
*/

// Pemeriksaan cepat bahwa API hidup (tanpa login).
Route::get('/ping', fn () => response()->json([
    'status' => 'ok',
    'waktu' => now()->toIso8601String(),
]));

$login = ['auth:sanctum', 'akun.aktif'];

// Akun: daftar, login, logout, profil, ganti password            → Syifa
// CATATAN: kelompok ini TANPA middleware karena berisi route publik (register, login).
// Route yang butuh login di dalamnya (logout, me, password) memasang $login sendiri.
Route::prefix('auth')->group(base_path('routes/api/auth.php'));

// Data referensi: section, layanan, lokasi (semua peran yang login) → Syifa
Route::prefix('referensi')->middleware($login)->group(base_path('routes/api/referensi.php'));

// Dipakai semua peran: notifikasi, unduh lampiran (semua yang login) → Syifa
Route::middleware($login)->group(base_path('routes/api/umum.php'));

// Modul per peran: hanya peran yang sesuai
Route::prefix('employee')->middleware([...$login, 'role:employee'])->group(base_path('routes/api/employee.php'));     // Syifa
Route::prefix('supervisor')->middleware([...$login, 'role:supervisor'])->group(base_path('routes/api/supervisor.php')); // Syifa
Route::prefix('pic')->middleware([...$login, 'role:pic'])->group(base_path('routes/api/pic.php'));                     // Faiz
Route::prefix('admin')->middleware([...$login, 'role:admin'])->group(base_path('routes/api/admin.php'));               // Faiz
