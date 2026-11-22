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
| Middleware peran (role:...) dan pengecekan akun aktif ditambahkan pada
| Sprint 1 Langkah 3 (hak akses). Sampai saat itu file peran masih kosong.
|
*/

// Pemeriksaan cepat bahwa API hidup (tanpa login).
Route::get('/ping', fn () => response()->json([
    'status' => 'ok',
    'waktu' => now()->toIso8601String(),
]));

// Akun: daftar, login, logout, profil, ganti password  → Syifa
Route::prefix('auth')->group(base_path('routes/api/auth.php'));

// Data referensi: section, layanan, lokasi                → Syifa
Route::prefix('referensi')->group(base_path('routes/api/referensi.php'));

// Dipakai semua peran: notifikasi, unduh lampiran         → Syifa
Route::group([], base_path('routes/api/umum.php'));

// Modul per peran
Route::prefix('employee')->group(base_path('routes/api/employee.php'));     // Syifa
Route::prefix('supervisor')->group(base_path('routes/api/supervisor.php')); // Syifa
Route::prefix('pic')->group(base_path('routes/api/pic.php'));               // Faiz
Route::prefix('admin')->group(base_path('routes/api/admin.php'));           // Faiz
