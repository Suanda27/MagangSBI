<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\Auth\RegisterController;
use Illuminate\Support\Facades\Route;

/*
| Route akun (daftar, login, logout, profil, ganti password).
| Diawali prefix /api/auth oleh routes/api.php. Grup induknya TANPA middleware karena berisi
| route publik; route yang butuh login memasang ['auth:sanctum', 'akun.aktif'] sendiri.
| Autentikasi: Sanctum SPA (cookie) -> frontend memanggil GET /sanctum/csrf-cookie lebih dulu.
| Pemilik: Syifa
*/

// ---- Publik --------------------------------------------------------------
// Daftar akun mandiri (dibatasi per menit per IP).
Route::post('register', RegisterController::class)
    ->middleware('throttle:'.config('register.throttle_per_minute', 6).',1')
    ->name('auth.register');

// Masuk. Pembatasan 5 percobaan per menit ada di LoginRequest (per akun + IP), PRD 6.1.
Route::post('login', [LoginController::class, 'login'])->name('auth.login');

// ---- Perlu login ---------------------------------------------------------
Route::middleware(['auth:sanctum', 'akun.aktif'])->group(function () {
    Route::post('logout', [LoginController::class, 'logout'])->name('auth.logout');
    Route::get('me', [LoginController::class, 'me'])->name('auth.me');

    // Profil sendiri (nama, email, telepon) dan ganti kata sandi.
    Route::patch('me', [ProfileController::class, 'update'])->name('auth.profile.update');
    Route::patch('password', [ProfileController::class, 'password'])->name('auth.password');
});
