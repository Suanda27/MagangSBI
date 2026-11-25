<?php

use App\Http\Controllers\Api\Pic\AksiPermintaanController;
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

// Aksi (Sprint 3.2 dan 3.3). Kirim hasil membawa berkas (multipart), jadi dibatasi lajunya.
Route::post('permintaan/{id}/kirim-hasil', [AksiPermintaanController::class, 'kirimHasil'])
    ->whereNumber('id')->middleware('throttle:30,1')->name('pic.permintaan.kirim-hasil');
Route::post('permintaan/{id}/terima', [AksiPermintaanController::class, 'terima'])->whereNumber('id')->name('pic.permintaan.terima');
Route::post('permintaan/{id}/tolak', [AksiPermintaanController::class, 'tolak'])->whereNumber('id')->name('pic.permintaan.tolak');
Route::post('permintaan/{id}/status', [AksiPermintaanController::class, 'ubahStatus'])->whereNumber('id')->name('pic.permintaan.status');

// Baca (Sprint 3.1).
Route::get('dashboard', [DashboardController::class, 'index'])->name('pic.dashboard');
Route::get('permintaan', [PermintaanController::class, 'index'])->name('pic.permintaan.index');
Route::get('permintaan/{id}', [PermintaanController::class, 'show'])->whereNumber('id')->name('pic.permintaan.show');
