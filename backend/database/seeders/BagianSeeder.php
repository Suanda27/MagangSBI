<?php

namespace Database\Seeders;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use Illuminate\Database\Seeder;

/** Lima section PT Sumitomo Wiring Systems Batam Indonesia. Aman dijalankan berulang. */
class BagianSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['ASM', 'Assembly', 'Lini perakitan utama dan kebutuhan area Assembly'],
            ['HR', 'Human Resource', 'Administrasi karyawan, surat keterangan, cuti, dan kepegawaian'],
            ['IS', 'Information System', 'Akses sistem, perangkat IT, jaringan, dan dukungan aplikasi'],
            ['PE', 'Production Engineering', 'Dukungan teknis mesin, jig, proses, dan otomasi produksi'],
            ['GA', 'General Affairs', 'Fasilitas gedung, lingkungan kerja, keamanan fisik, dan layanan umum'],
        ];

        foreach ($data as [$kode, $nama, $deskripsi]) {
            Bagian::updateOrCreate(
                ['kode_bagian' => $kode],
                ['nama_bagian' => $nama, 'deskripsi' => $deskripsi, 'status' => StatusAkun::Aktif],
            );
        }
    }
}
