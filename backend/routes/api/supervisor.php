<?php

use App\Http\Controllers\Api\Supervisor\DashboardController;
use App\Http\Controllers\Api\Supervisor\LaporanController;
use App\Http\Controllers\Api\Supervisor\PermintaanController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| Route modul Supervisor (dashboard, monitoring, laporan, ekspor).
| Diawali prefix /api/supervisor dan sudah dilindungi auth:sanctum + akun.aktif + role:supervisor
| oleh routes/api.php, jadi tidak perlu dipasang ulang di sini.
| Pemilik: Syifa
*/

// Pemeriksaan akses peran: menjawab peran sesi yang sedang masuk. Dipakai tes hak akses
// dan boleh dipakai pengaman halaman frontend. Aman dihapus/diganti setelah ada endpoint nyata.
Route::get('/ping', fn (Request $request) => response()->json([
    'peran' => $request->user()->role->value,
]));

Route::get('dashboard', [DashboardController::class, 'index'])->name('supervisor.dashboard');

// Monitoring tiket section sendiri (read-only).
Route::get('permintaan', [PermintaanController::class, 'index'])->name('supervisor.permintaan.index');
Route::get('permintaan/{id}', [PermintaanController::class, 'show'])->whereNumber('id')->name('supervisor.permintaan.show');

// Laporan section sendiri: rekap, statistik, dan tren, plus ekspor CSV, Excel, dan PDF (dibatasi laju).
Route::get('laporan', [LaporanController::class, 'index'])->name('supervisor.laporan');
Route::get('laporan/ekspor', [LaporanController::class, 'ekspor'])->middleware('throttle:20,1')->name('supervisor.laporan.ekspor');
