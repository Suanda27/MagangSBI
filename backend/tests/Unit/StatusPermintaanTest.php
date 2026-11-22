<?php

namespace Tests\Unit;

use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Aturan alur status tiket (PRD Bagian 4.2). */
class StatusPermintaanTest extends TestCase
{
    /** @return array<string, array{StatusPermintaan, StatusPermintaan}> */
    public static function transisiDiizinkan(): array
    {
        return [
            'terima' => [StatusPermintaan::Submitted, StatusPermintaan::InProgress],
            'tolak' => [StatusPermintaan::Submitted, StatusPermintaan::Rejected],
            'tunda' => [StatusPermintaan::InProgress, StatusPermintaan::Pending],
            'lanjutkan' => [StatusPermintaan::Pending, StatusPermintaan::InProgress],
            'kirim hasil dari proses' => [StatusPermintaan::InProgress, StatusPermintaan::WaitingReview],
            'kirim hasil dari pending' => [StatusPermintaan::Pending, StatusPermintaan::WaitingReview],
            'setujui' => [StatusPermintaan::WaitingReview, StatusPermintaan::Completed],
            'revisi' => [StatusPermintaan::WaitingReview, StatusPermintaan::InProgress],
        ];
    }

    /** @return array<string, array{StatusPermintaan, StatusPermintaan}> */
    public static function transisiDilarang(): array
    {
        return [
            'lompat ke selesai tanpa ditinjau' => [StatusPermintaan::InProgress, StatusPermintaan::Completed],
            'langsung selesai dari antrean' => [StatusPermintaan::Submitted, StatusPermintaan::Completed],
            'tolak setelah diterima' => [StatusPermintaan::InProgress, StatusPermintaan::Rejected],
            'kembali ke antrean' => [StatusPermintaan::InProgress, StatusPermintaan::Submitted],
            'pending langsung selesai' => [StatusPermintaan::Pending, StatusPermintaan::Completed],
            'selesai dibuka lagi' => [StatusPermintaan::Completed, StatusPermintaan::InProgress],
            'ditolak dibuka lagi' => [StatusPermintaan::Rejected, StatusPermintaan::Submitted],
            'status sama' => [StatusPermintaan::InProgress, StatusPermintaan::InProgress],
        ];
    }

    #[DataProvider('transisiDiizinkan')]
    public function test_transisi_yang_diizinkan(StatusPermintaan $dari, StatusPermintaan $ke): void
    {
        $this->assertTrue($dari->bolehKe($ke));
    }

    #[DataProvider('transisiDilarang')]
    public function test_transisi_yang_dilarang(StatusPermintaan $dari, StatusPermintaan $ke): void
    {
        $this->assertFalse($dari->bolehKe($ke));
    }

    public function test_status_final_tidak_punya_tujuan(): void
    {
        foreach ([StatusPermintaan::Completed, StatusPermintaan::Rejected] as $final) {
            $this->assertTrue($final->isFinal());
            $this->assertSame([], $final->tujuanDiizinkan());
        }
    }

    public function test_hanya_empat_status_yang_masih_berjalan(): void
    {
        $this->assertEqualsCanonicalizing(
            ['submitted', 'in_progress', 'pending', 'waiting_review'],
            StatusPermintaan::aktif(),
        );
    }

    public function test_label_karyawan_untuk_status_awal_adalah_diajukan(): void
    {
        $this->assertSame('Diajukan', StatusPermintaan::Submitted->labelKaryawan());
        $this->assertSame('Menunggu Pemeriksaan', StatusPermintaan::Submitted->label());
        $this->assertSame('Sedang Diproses', StatusPermintaan::InProgress->labelKaryawan());
    }

    public function test_bobot_prioritas_mendesak_paling_tinggi(): void
    {
        $this->assertGreaterThan(Prioritas::Tinggi->bobot(), Prioritas::Mendesak->bobot());
        $this->assertGreaterThan(Prioritas::Normal->bobot(), Prioritas::Tinggi->bobot());
    }
}
