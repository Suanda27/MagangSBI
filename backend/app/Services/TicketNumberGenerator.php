<?php

namespace App\Services;

use App\Models\Bagian;
use App\Models\Pengaturan;
use App\Models\UrutanTiket;
use Illuminate\Support\Facades\DB;

/**
 * Membuat nomor tiket unik per section per tahun: {kode_bagian}-{tahun}-{urutan}, mis. GA-2026-0001.
 *
 * Baris penghitung (urutan_tikets) dikunci dengan lockForUpdate di dalam transaksi, sehingga dua tiket
 * yang dibuat bersamaan tidak pernah mendapat nomor yang sama. Dipanggil dari dalam transaksi pembuatan
 * tiket: bila pembuatan tiket gagal dan di-rollback, nomor ikut dikembalikan (tidak ada nomor bolong).
 */
class TicketNumberGenerator
{
    public function generate(Bagian|int $bagian, ?int $tahun = null): string
    {
        $bagian = $bagian instanceof Bagian ? $bagian : Bagian::query()->findOrFail($bagian);
        $tahun ??= (int) now()->year;
        $digit = max(1, (int) Pengaturan::ambil('digit_nomor_tiket', '4'));

        return DB::transaction(function () use ($bagian, $tahun, $digit) {
            // Pastikan barisnya ada, lalu ambil ulang dengan kunci.
            UrutanTiket::query()->firstOrCreate(
                ['id_bagian' => $bagian->id, 'tahun' => $tahun],
                ['terakhir' => 0],
            );

            $urutan = UrutanTiket::query()
                ->where('id_bagian', $bagian->id)
                ->where('tahun', $tahun)
                ->lockForUpdate()
                ->firstOrFail();

            $urutan->terakhir++;
            $urutan->save();

            return sprintf('%s-%d-%s', $bagian->kode_bagian, $tahun, str_pad((string) $urutan->terakhir, $digit, '0', STR_PAD_LEFT));
        });
    }
}
