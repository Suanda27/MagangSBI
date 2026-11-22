<?php

use App\Http\Controllers\Api\Referensi\SectionController;
/*
| Route data referensi (section, layanan per section, lokasi).
| Diawali prefix /api/referensi oleh routes/api.php.
| Pemilik: Syifa
*/

use Illuminate\Support\Facades\Route;

// Daftar section aktif untuk dropdown form (publik, read-only).
Route::get('section', [SectionController::class, 'index'])->name('referensi.section');
