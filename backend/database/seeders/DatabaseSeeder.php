<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Urutan penting: Bagian → Layanan/Lokasi → Pengguna (butuh Bagian) → Pengaturan.
     * Semua seeder idempotent, jadi aman dijalankan ulang.
     */
    public function run(): void
    {
        $this->call([
            BagianSeeder::class,
            LayananSeeder::class,
            LokasiSeeder::class,
            PenggunaSeeder::class,
            PengaturanSeeder::class,
        ]);
    }
}
