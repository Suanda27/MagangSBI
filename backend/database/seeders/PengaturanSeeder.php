<?php

namespace Database\Seeders;

use App\Models\Pengaturan;
use Illuminate\Database\Seeder;

/** Nilai awal pengaturan sistem (dapat diubah Admin dari halaman Settings). */
class PengaturanSeeder extends Seeder
{
    public function run(): void
    {
        $awal = [
            'max_upload_mb' => 5,                 // batas ukuran per berkas (1–5 MB)
            'format_lampiran' => 'jpg,png,pdf',   // format berkas yang diizinkan
            'digit_nomor_tiket' => 4,             // GA-2026-0001
        ];

        foreach ($awal as $kunci => $nilai) {
            Pengaturan::firstOrCreate(['kunci' => $kunci], ['nilai' => (string) $nilai]);
        }
    }
}
