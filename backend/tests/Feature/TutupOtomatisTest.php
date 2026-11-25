<?php

namespace Tests\Feature;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Exceptions\BelumJatuhTempo;
use App\Exceptions\TransisiTidakValid;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Services\TicketWorkflow;
use App\Support\HariKerja;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** Hitung hari kerja, TicketWorkflow::tutupOtomatis, dan perintah terjadwal tiket:tutup-otomatis. */
class TutupOtomatisTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    private function tiket(?string $dikirim, StatusPermintaan $status = StatusPermintaan::WaitingReview): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'id_pic' => $this->picIs->id,
            'status' => $status,
            'dikirim_pada' => $dikirim,
        ]);
    }

    // ---- Hari kerja ----------------------------------------------------

    public function test_hari_kerja_melewati_akhir_pekan(): void
    {
        // Senin 24 Nov 2025 + 3 hari kerja = Kamis 27 Nov 2025.
        $this->assertSame('2025-11-27 10:30:00', HariKerja::tambah(CarbonImmutable::parse('2025-11-24 10:30:00'), 3)->toDateTimeString());
        // Kamis 27 Nov + 3 = Selasa 2 Des (Jumat, Senin, Selasa).
        $this->assertSame('2025-12-02 09:00:00', HariKerja::batasTutupOtomatis(CarbonImmutable::parse('2025-11-27 09:00:00'))->toDateTimeString());
        // Jumat + 3 = Rabu berikutnya.
        $this->assertSame('2025-12-03', HariKerja::tambah(CarbonImmutable::parse('2025-11-28 16:00:00'), 3)->toDateString());
        // Dikirim hari Sabtu: Senin, Selasa, Rabu.
        $this->assertSame('2025-12-03', HariKerja::tambah(CarbonImmutable::parse('2025-11-29 12:00:00'), 3)->toDateString());
        $this->assertSame('2025-11-24', HariKerja::tambah(CarbonImmutable::parse('2025-11-24'), 0)->toDateString());
    }

    // ---- Workflow ------------------------------------------------------

    public function test_tiket_lewat_tiga_hari_kerja_ditutup_oleh_sistem(): void
    {
        Event::fake([TiketDiubah::class]);
        CarbonImmutable::setTestNow('2025-12-02 09:01:00'); // Selasa
        $tiket = $this->tiket('2025-11-27 09:00:00');        // Kamis; batas Selasa 09:00

        $hasil = app(TicketWorkflow::class)->tutupOtomatis($tiket);

        $this->assertSame(StatusPermintaan::Completed, $hasil->status);
        $this->assertNotNull($hasil->selesai_pada);

        $riwayat = RiwayatPermintaan::where('id_permintaan', $tiket->id)->sole();
        $this->assertSame(AksiRiwayat::AutoClosed, $riwayat->aksi);
        $this->assertNull($riwayat->id_user); // pelaku = Sistem
        $this->assertStringContainsString('3 hari kerja', (string) $riwayat->keterangan);

        Event::assertDispatched(TiketDiubah::class, fn ($e) => $e->aksi === AksiRiwayat::AutoClosed && $e->pelaku === null);
    }

    public function test_tiket_belum_jatuh_tempo_ditolak_409(): void
    {
        CarbonImmutable::setTestNow('2025-12-02 08:59:00');
        $tiket = $this->tiket('2025-11-27 09:00:00');

        $this->expectException(BelumJatuhTempo::class);

        try {
            app(TicketWorkflow::class)->tutupOtomatis($tiket);
        } finally {
            $this->assertSame(StatusPermintaan::WaitingReview, $tiket->fresh()->status);
            $this->assertSame(0, RiwayatPermintaan::count());
        }
    }

    public function test_tiket_yang_bukan_menunggu_konfirmasi_ditolak_409(): void
    {
        CarbonImmutable::setTestNow('2025-12-10 09:00:00');

        foreach ([StatusPermintaan::InProgress, StatusPermintaan::Completed, StatusPermintaan::Pending] as $status) {
            $tiket = $this->tiket('2025-11-27 09:00:00', $status);
            $this->assertThrows(fn () => app(TicketWorkflow::class)->tutupOtomatis($tiket), TransisiTidakValid::class);
        }
    }

    public function test_dikirim_ulang_saat_perintah_berjalan_tidak_ditutup(): void
    {
        CarbonImmutable::setTestNow('2025-12-10 09:00:00');
        $usang = $this->tiket('2025-11-27 09:00:00'); // salinan yang dibaca perintah
        // PIC mengirim ulang hasil revisi sesudah salinan dibaca.
        Permintaan::whereKey($usang->id)->update(['dikirim_pada' => '2025-12-10 08:59:00']);

        $this->assertThrows(fn () => app(TicketWorkflow::class)->tutupOtomatis($usang), TransisiTidakValid::class);
        $this->assertSame(StatusPermintaan::WaitingReview, $usang->fresh()->status);
    }

    // ---- Perintah terjadwal -------------------------------------------

    public function test_perintah_menutup_yang_jatuh_tempo_saja(): void
    {
        CarbonImmutable::setTestNow('2025-12-02 10:00:00'); // Selasa
        $jatuhTempo = $this->tiket('2025-11-27 09:00:00');   // Kamis -> batas Selasa 09:00
        $belum = $this->tiket('2025-11-28 09:00:00');        // Jumat -> batas Rabu 09:00
        $baru = $this->tiket('2025-12-02 08:00:00');
        $diproses = $this->tiket('2025-11-20 09:00:00', StatusPermintaan::InProgress);

        $this->artisan('tiket:tutup-otomatis')
            ->expectsOutputToContain('Ditutup: '.$jatuhTempo->kode_tiket)
            ->expectsOutputToContain('Ditutup: 1, dilewati: 1, gagal: 0.')
            ->assertSuccessful();

        $this->assertSame(StatusPermintaan::Completed, $jatuhTempo->fresh()->status);
        $this->assertSame(StatusPermintaan::WaitingReview, $belum->fresh()->status);
        $this->assertSame(StatusPermintaan::WaitingReview, $baru->fresh()->status);
        $this->assertSame(StatusPermintaan::InProgress, $diproses->fresh()->status);
    }

    public function test_akhir_pekan_tidak_dihitung_sehingga_tiket_jumat_belum_ditutup_hari_senin(): void
    {
        CarbonImmutable::setTestNow('2025-12-01 12:00:00'); // Senin
        $tiket = $this->tiket('2025-11-27 09:00:00');        // Kamis lalu: 4 hari kalender, baru 2 hari kerja

        $this->artisan('tiket:tutup-otomatis')->expectsOutputToContain('Ditutup: 0, dilewati: 1')->assertSuccessful();
        $this->assertSame(StatusPermintaan::WaitingReview, $tiket->fresh()->status);
    }

    public function test_perintah_aman_dijalankan_berulang(): void
    {
        CarbonImmutable::setTestNow('2025-12-10 09:00:00');
        $tiket = $this->tiket('2025-11-27 09:00:00');

        $this->artisan('tiket:tutup-otomatis')->expectsOutputToContain('Ditutup: 1')->assertSuccessful();
        $this->artisan('tiket:tutup-otomatis')->expectsOutputToContain('Ditutup: 0, dilewati: 0')->assertSuccessful();

        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->where('aksi', AksiRiwayat::AutoClosed)->count());
    }

    public function test_tiket_tertutup_otomatis_tampil_selesai_bagi_pic_dan_karyawan(): void
    {
        CarbonImmutable::setTestNow('2025-12-10 09:00:00');
        $tiket = $this->tiket('2025-11-27 09:00:00');
        $this->artisan('tiket:tutup-otomatis')->assertSuccessful();

        Sanctum::actingAs($this->picIs);
        $this->getJson('/api/pic/permintaan?tab=selesai')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.status', 'completed');

        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.riwayat.0.pelaku', 'Sistem');
    }

    public function test_perintah_terdaftar_di_jadwal_tiap_jam(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('tiket:tutup-otomatis')->assertSuccessful();
    }
}
