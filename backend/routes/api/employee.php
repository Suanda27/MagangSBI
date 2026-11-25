<?php

use App\Http\Controllers\Api\Employee\DashboardController;
use App\Http\Controllers\Api\Employee\KonfirmasiHasilController;
use App\Http\Controllers\Api\Employee\PermintaanController;
use App\Http\Controllers\Api\Employee\RiwayatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
| Route modul Karyawan (dashboard, permintaan, setujui, revisi, riwayat).
| Diawali prefix /api/employee dan sudah dilindungi auth:sanctum + akun.aktif + role:employee
| oleh routes/api.php, jadi tidak perlu dipasang ulang di sini.
| Pemilik: Syifa
*/

// Pemeriksaan akses peran: menjawab peran sesi yang sedang masuk. Dipakai tes hak akses
// dan boleh dipakai pengaman halaman frontend. Aman dihapus/diganti setelah ada endpoint nyata.
Route::get('/ping', fn (Request $request) => response()->json([
    'peran' => $request->user()->role->value,
]));

Route::get('dashboard', [DashboardController::class, 'index'])->name('employee.dashboard');

// Daftar dan detail tiket sendiri.
Route::get('permintaan', [PermintaanController::class, 'index'])->name('employee.permintaan.index');
Route::get('permintaan/{id}', [PermintaanController::class, 'show'])->whereNumber('id')->name('employee.permintaan.show');

// Tanggapan atas hasil kerja PIC (Sprint 3.3): hanya untuk tiket Menunggu Konfirmasi milik sendiri.
Route::post('permintaan/{id}/setujui', [KonfirmasiHasilController::class, 'setujui'])->whereNumber('id')->name('employee.permintaan.setujui');
Route::post('permintaan/{id}/revisi', [KonfirmasiHasilController::class, 'revisi'])->whereNumber('id')->name('employee.permintaan.revisi');

// Log aktivitas seluruh tiket sendiri.
Route::get('riwayat', [RiwayatController::class, 'index'])->name('employee.riwayat');

// Pengajuan tiket baru (multipart). Dibatasi agar tidak dipakai membanjiri antrean.
Route::post('permintaan', [PermintaanController::class, 'store'])
    ->middleware('throttle:30,1')
    ->name('employee.permintaan.store');
