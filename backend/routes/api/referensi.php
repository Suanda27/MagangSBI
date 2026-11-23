<?php

use App\Http\Controllers\Api\Referensi\AturanLampiranController;
use App\Http\Controllers\Api\Referensi\LayananController;
use App\Http\Controllers\Api\Referensi\LokasiController;
use App\Http\Controllers\Api\Referensi\SectionController;
use Illuminate\Support\Facades\Route;

/*
| Route data referensi (section, layanan per section, lokasi).
| Diawali prefix /api/referensi oleh routes/api.php. Grup ini PUBLIK (dipakai form registrasi
| sebelum login). Route yang hanya untuk pengguna login (layanan, lokasi) dibungkus:
|   Route::middleware(['auth:sanctum', 'akun.aktif'])->group(function () { ... });
| Pemilik: Syifa
*/

// Daftar section aktif untuk dropdown form (publik, read-only). Sesuai PRD 6.2.
Route::get('sections', [SectionController::class, 'index'])->name('referensi.sections');

// Khusus pengguna login: dipakai form pengajuan layanan.
Route::middleware(['auth:sanctum', 'akun.aktif'])->group(function () {
    Route::get('layanan', [LayananController::class, 'index'])->name('referensi.layanan');
    Route::get('lokasi', [LokasiController::class, 'index'])->name('referensi.lokasi');
    Route::get('aturan-lampiran', [AturanLampiranController::class, 'index'])->name('referensi.aturan-lampiran');
});
