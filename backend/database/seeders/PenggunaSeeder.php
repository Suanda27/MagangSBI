<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Akun contoh untuk pengembangan lokal: 1 Admin, 1 Supervisor per section, PIC (dua orang di
 * IS dan GA untuk menguji penerimaan ganda), dan 1 Karyawan per section.
 *
 * Semua akun memakai kata sandi dari SEED_DEFAULT_PASSWORD (default "password").
 * JANGAN dipakai di server sungguhan.
 */
class PenggunaSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEED_DEFAULT_PASSWORD', 'password');
        $bagian = Bagian::pluck('id', 'kode_bagian');

        $buat = function (string $email, string $nik, string $nama, Role $role, ?string $kodeBagian, string $jabatan) use ($password, $bagian) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'nik' => $nik,
                    'name' => $nama,
                    'password' => $password,
                    'role' => $role,
                    'id_bagian' => $kodeBagian ? $bagian[$kodeBagian] : null,
                    'jabatan' => $jabatan,
                    'telepon' => '+62 812-0000-'.substr($nik, -4),
                    'status' => StatusAkun::Aktif,
                    'email_verified_at' => now(),
                ],
            );
        };

        // Admin
        $buat('admin@sbi.test', '21000001', 'Admin ISM', Role::Admin, null, 'Administrator Sistem');

        // Supervisor: satu per section
        $supervisor = [
            'ASM' => 'Supervisor Assembly', 'HR' => 'Supervisor HR', 'IS' => 'Supervisor IS',
            'PE' => 'Supervisor PE', 'GA' => 'Supervisor GA',
        ];
        $i = 0;
        foreach ($supervisor as $kode => $nama) {
            $i++;
            $buat('supervisor.'.strtolower($kode).'@sbi.test', sprintf('2100010%d', $i), $nama, Role::Supervisor, $kode, 'Supervisor '.$kode);
        }

        // PIC: IS dan GA masing-masing dua orang
        $pic = [
            ['pic.is1@sbi.test', '21000201', 'Budi Santoso', 'IS'],
            ['pic.is2@sbi.test', '21000202', 'Rina Wulandari', 'IS'],
            ['pic.ga1@sbi.test', '21000203', 'Hendra Wijaya', 'GA'],
            ['pic.ga2@sbi.test', '21000204', 'Sari Puspita', 'GA'],
            ['pic.pe1@sbi.test', '21000205', 'Doni Prasetyo', 'PE'],
            ['pic.asm1@sbi.test', '21000206', 'Agus Setiawan', 'ASM'],
            ['pic.hr1@sbi.test', '21000207', 'Dewi Anggraini', 'HR'],
        ];
        foreach ($pic as [$email, $nik, $nama, $kode]) {
            $buat($email, $nik, $nama, Role::Pic, $kode, 'PIC '.$kode);
        }

        // Karyawan: satu per section
        $karyawan = [
            ['karyawan.asm@sbi.test', '22010456', 'Muhammad Faiz Difa Suanda', 'ASM', 'Senior Assembly Specialist'],
            ['karyawan.pe@sbi.test', '22010512', 'Siti Rahmawati', 'PE', 'Process Engineer'],
            ['karyawan.is@sbi.test', '22010204', 'Dimas Anggara', 'IS', 'Staf IS'],
            ['karyawan.hr@sbi.test', '22010871', 'Maya Lestari', 'HR', 'HR Officer'],
            ['karyawan.ga@sbi.test', '22010642', 'Dewi Sartika', 'GA', 'Staf GA'],
        ];
        foreach ($karyawan as [$email, $nik, $nama, $kode, $jabatan]) {
            $buat($email, $nik, $nama, Role::Employee, $kode, $jabatan);
        }
    }
}
