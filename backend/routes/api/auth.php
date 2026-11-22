<?php

use App\Http\Controllers\Api\Auth\RegisterController;
/*
| Route akun (daftar, login, logout, profil, ganti password).
| Diawali prefix /api/auth oleh routes/api.php.
| Pemilik: Syifa
*/

use Illuminate\Support\Facades\Route;

// Daftar akun mandiri (publik, dibatasi per menit per IP).
Route::post('register', RegisterController::class)
    ->middleware('throttle:'.config('register.throttle_per_minute', 6).',1')
    ->name('auth.register');

// Route::post('login', ...)   // TODO: LoginController (Sanctum SPA)
