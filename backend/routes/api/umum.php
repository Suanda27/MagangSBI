<?php

use App\Http\Controllers\Api\LampiranController;
use App\Http\Controllers\Api\NotifikasiController;
use Illuminate\Support\Facades\Route;

/*
| Route yang dipakai semua peran (notifikasi, unduh lampiran). Tanpa prefix tambahan.
| Diawali prefix /api oleh routes/api.php.
| Pemilik: Syifa
*/

// Unduh lampiran tiket; hak akses diperiksa PermintaanPolicy::unduhLampiran di controller.
Route::get('lampiran/{lampiran}', [LampiranController::class, 'show'])->whereNumber('lampiran')->name('lampiran.show');

// Notifikasi dalam aplikasi (D8: tanpa email): milik sendiri, untuk semua peran.
Route::get('notifikasi', [NotifikasiController::class, 'index'])->name('notifikasi.index');
Route::post('notifikasi/baca', [NotifikasiController::class, 'baca'])->name('notifikasi.baca');
