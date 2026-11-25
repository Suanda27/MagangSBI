<?php

use App\Http\Controllers\Api\Pic\DashboardController;
use App\Http\Controllers\Api\Pic\PermintaanController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| Route modul PIC (antrean, terima, tolak, status, kirim-hasil, riwayat, laporan).
| Diawali prefix /api/pic dan sudah dilindungi auth:sanctum + akun.aktif + role:pic
| oleh routes/api.php, jadi tidak perlu dipasang ulang di sini.
| Pemilik: Faiz
*/

// Pemeriksaan akses peran: menjawab peran sesi yang sedang masuk. Dipakai tes hak akses
// dan boleh dipakai pengaman halaman frontend. Aman dihapus/diganti setelah ada endpoint nyata.
Route::get('/ping', fn (Request $request) => response()->json([
    'peran' => $request->user()->role->value,
]));

// Baca (Sprint 3.1). Aksi terima/tolak/status/kirim-hasil menyusul di 3.2 dan seterusnya.
Route::get('dashboard', [DashboardController::class, 'index'])->name('pic.dashboard');
Route::get('permintaan', [PermintaanController::class, 'index'])->name('pic.permintaan.index');
Route::get('permintaan/{id}', [PermintaanController::class, 'show'])->whereNumber('id')->name('pic.permintaan.show');
