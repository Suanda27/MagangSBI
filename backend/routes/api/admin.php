<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\LantaiController;
use App\Http\Controllers\Api\Admin\LayananController;
use App\Http\Controllers\Api\Admin\PengaturanController;
use App\Http\Controllers\Api\Admin\PermintaanController;
use App\Http\Controllers\Api\Admin\PicMappingController;
use App\Http\Controllers\Api\Admin\PlantController;
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

// Dashboard dan pantauan semua tiket (Sprint 4.2). Hanya baca: status tiket diubah PIC dan karyawan.
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/permintaan', [PermintaanController::class, 'index']);
Route::get('/permintaan/{id}', [PermintaanController::class, 'show'])->whereNumber('id');

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

// Lokasi: plant dan lantai (dinonaktifkan, tidak dihapus).
Route::get('/plants', [PlantController::class, 'index']);
Route::post('/plants', [PlantController::class, 'store']);
Route::patch('/plants/{plant}', [PlantController::class, 'update']);

Route::get('/lantais', [LantaiController::class, 'index']);
Route::post('/lantais', [LantaiController::class, 'store']);
Route::patch('/lantais/{lantai}', [LantaiController::class, 'update']);

// Pemetaan PIC ke section. DELETE = kembalikan ke karyawan (akun tidak dihapus).
Route::get('/pic-mapping', [PicMappingController::class, 'index']);
Route::post('/pic-mapping', [PicMappingController::class, 'store']);
Route::patch('/pic-mapping/{user}', [PicMappingController::class, 'update']);
Route::delete('/pic-mapping/{user}', [PicMappingController::class, 'destroy']);

// Pengaturan sistem: batas ukuran dan format lampiran.
Route::get('/pengaturan', [PengaturanController::class, 'show']);
Route::patch('/pengaturan', [PengaturanController::class, 'update']);
