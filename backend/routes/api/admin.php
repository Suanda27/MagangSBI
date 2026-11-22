<?php

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
