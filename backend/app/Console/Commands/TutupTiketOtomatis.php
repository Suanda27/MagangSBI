<?php

namespace App\Console\Commands;

use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Services\TicketWorkflow;
use App\Support\HariKerja;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Throwable;

/**
 * Menutup tiket Menunggu Konfirmasi yang tidak ditanggapi karyawan dalam 3 hari kerja.
 * Dijadwalkan tiap jam (routes/console.php). Aman dijalankan berulang: tiket yang sudah ditutup,
 * ditanggapi, atau dikirim ulang oleh PIC dilewati.
 */
#[Signature('tiket:tutup-otomatis')]
#[Description('Tutup otomatis tiket Menunggu Konfirmasi yang lewat 3 hari kerja tanpa tanggapan karyawan')]
class TutupTiketOtomatis extends Command
{
    public function handle(TicketWorkflow $workflow): int
    {
        $ditutup = 0;
        $dilewati = 0;
        $gagal = 0;

        // 3 hari kerja selalu sama dengan atau lebih lama dari 3 hari kalender, jadi ini penyaring kasar yang aman;
        // keputusan akhir (hari kerja yang tepat) diambil TicketWorkflow::tutupOtomatis.
        Permintaan::query()
            ->where('status', StatusPermintaan::WaitingReview->value)
            ->whereNotNull('dikirim_pada')
            ->where('dikirim_pada', '<=', now()->subDays(HariKerja::BATAS_TUTUP_OTOMATIS))
            ->orderBy('id')
            ->each(function (Permintaan $tiket) use ($workflow, &$ditutup, &$dilewati, &$gagal) {
                try {
                    $workflow->tutupOtomatis($tiket);
                    $ditutup++;
                    $this->line("Ditutup: {$tiket->kode_tiket}");
                } catch (ConflictHttpException) {
                    $dilewati++; // belum jatuh tempo (akhir pekan) atau sudah ditanggapi
                } catch (Throwable $e) {
                    $gagal++;
                    report($e); // satu tiket bermasalah tidak boleh menghentikan yang lain
                    $this->error("Gagal: {$tiket->kode_tiket} ({$e->getMessage()})");
                }
            });

        $this->info("Selesai. Ditutup: {$ditutup}, dilewati: {$dilewati}, gagal: {$gagal}.");

        return $gagal > 0 ? self::FAILURE : self::SUCCESS;
    }
}
