<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Hitung hari kerja (Senin sampai Jumat). Tanggal libur nasional belum diperhitungkan
 * (asumsi PRD); aturannya sama dengan tambahHariKerja di frontend (lib/pic/format.ts)
 * supaya batas yang tampil di layar sama dengan batas yang dipakai server.
 */
final class HariKerja
{
    /** Jumlah hari kerja tanpa tanggapan karyawan sebelum tiket ditutup otomatis (PRD). */
    public const BATAS_TUTUP_OTOMATIS = 3;

    /** Tambah $hari hari kerja; jam dan menit dipertahankan. Awal akhir pekan dihitung mulai Senin. */
    public static function tambah(CarbonInterface $awal, int $hari): CarbonImmutable
    {
        $tanggal = CarbonImmutable::instance($awal);
        $sisa = $hari;

        while ($sisa > 0) {
            $tanggal = $tanggal->addDay();

            if (! $tanggal->isWeekend()) {
                $sisa--;
            }
        }

        return $tanggal;
    }

    /** Batas waktu tutup otomatis untuk hasil yang dikirim pada $dikirim. */
    public static function batasTutupOtomatis(CarbonInterface $dikirim): CarbonImmutable
    {
        return self::tambah($dikirim, self::BATAS_TUTUP_OTOMATIS);
    }
}
