<?php

use App\Http\Controllers\Api\LampiranController;
use Illuminate\Support\Facades\Route;

/*
| Route yang dipakai semua peran (notifikasi, unduh lampiran). Tanpa prefix tambahan.
| Diawali prefix /api oleh routes/api.php.
| Pemilik: Syifa
*/

// Unduh lampiran tiket; hak akses diperiksa PermintaanPolicy::unduhLampiran di controller.
Route::get('lampiran/{lampiran}', [LampiranController::class, 'show'])->whereNumber('lampiran')->name('lampiran.show');
