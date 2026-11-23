<?php

use App\Http\Controllers\Api\Admin\LayananController;
use App\Http\Controllers\Api\Admin\SectionController;
use App\Http\Controllers\Api\Admin\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| Route modul Admin (pengguna, section, layanan, lokasi, pemetaan PIC, laporan, pengaturan).
| Diawali prefix /api/admin dan sudah dilindungi auth:sanctum + akun.aktif + role:admin
| oleh routes/api.php, jadi tidak perlu dipasang ulang di sini.
| Pemilik: Faiz
*/

// Pemeriksaan akses peran: menjawab peran sesi yang sedang masuk. Dipakai tes hak akses
// dan boleh dipakai pengaman halaman frontend. Aman dihapus/diganti setelah ada endpoint nyata.
Route::get('/ping', fn (Request $request) => response()->json([
    'peran' => $request->user()->role->value,
]));

// Master data (PRD 6.5). Data dinonaktifkan lewat status, tidak ada DELETE.
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::patch('/users/{user}', [UserController::class, 'update']);

Route::get('/sections', [SectionController::class, 'index']);
Route::post('/sections', [SectionController::class, 'store']);
Route::patch('/sections/{bagian}', [SectionController::class, 'update']);

Route::get('/layanan', [LayananController::class, 'index']);
Route::post('/layanan', [LayananController::class, 'store']);
Route::patch('/layanan/{layanan}', [LayananController::class, 'update']);
