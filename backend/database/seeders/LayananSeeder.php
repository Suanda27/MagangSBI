<?php

namespace Database\Seeders;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Layanan;
use Illuminate\Database\Seeder;

/** Katalog layanan per section (kategori → daftar layanan). Jalankan setelah BagianSeeder. */
class LayananSeeder extends Seeder
{
    public function run(): void
    {
        $katalog = [
            'PE' => [
                'Peralatan & Otomasi' => ['Perbaikan Aset', 'Otomasi Industri', 'Kalibrasi Alat'],
                'Proses & Tooling' => ['Perbaikan Jig / Fixture', 'Perubahan Layout Proses', 'Permintaan Tooling'],
            ],
            'HR' => [
                'Admin Karyawan' => ['Surat Keterangan Kerja', 'Pembaruan Data Karyawan', 'Surat Magang'],
                'Kehadiran & Cuti' => ['Koreksi Absensi', 'Pengajuan Cuti Khusus'],
            ],
            'IS' => [
                'Dukungan IT' => ['Akses Sistem', 'Dukungan Perangkat Lunak', 'Dukungan Perangkat Keras'],
                'Infrastruktur' => ['Jaringan & Komunikasi', 'Email & Akun', 'Printer & Scanner'],
            ],
            'GA' => [
                'Fasilitas & Gedung' => ['Perbaikan AC', 'Perbaikan Fasilitas', 'Listrik & Pencahayaan'],
                'Keamanan & Umum' => ['Keamanan Fisik', 'Kendaraan & Transportasi', 'Kebersihan'],
            ],
            'ASM' => [
                'Lini Perakitan' => ['Permintaan Alat Kerja', 'Perbaikan Workstation', 'Penambahan Material Pendukung'],
                'Keselamatan Kerja' => ['Alat Pelindung Diri (APD)', 'Ergonomi Workstation'],
            ],
        ];

        foreach ($katalog as $kodeBagian => $kategoris) {
            $bagian = Bagian::where('kode_bagian', $kodeBagian)->firstOrFail();
            $urut = 0;

            foreach ($kategoris as $kategori => $daftar) {
                foreach ($daftar as $nama) {
                    $urut++;
                    Layanan::updateOrCreate(
                        ['kode_layanan' => sprintf('%s-%02d', $kodeBagian, $urut)],
                        [
                            'nama_layanan' => $nama,
                            'kategori' => $kategori,
                            'deskripsi' => null,
                            'id_bagian' => $bagian->id,
                            'status' => StatusAkun::Aktif,
                        ],
                    );
                }
            }
        }
    }
}
