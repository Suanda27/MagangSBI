<?php

namespace Tests\Feature\Supervisor;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/supervisor/laporan: rekap dan statistik tiket section sendiri, tanpa SLA. */
class LaporanSupervisorTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    private Layanan $layananIs2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();

        // Kategori ditetapkan eksplisit (factory memilih acak) agar hitungan per kategori pasti.
        $this->layananIs->update(['kategori' => 'Dukungan IT']);
        $this->layananIs2 = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id, 'kategori' => 'Jaringan']);
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], ?Layanan $layanan = null): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => ($layanan ?? $this->layananIs)->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    private function laporan(string $query = ''): TestResponse
    {
        return $this->getJson('/api/supervisor/laporan'.($query === '' ? '' : '?'.$query));
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_supervisor(): void
    {
        $this->laporan()->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->laporan()->assertForbidden();
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->supIs->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->supIs->fresh());

        $this->laporan()->assertForbidden();
    }

    // ---- Cakupan section (A1) ------------------------------------------

    public function test_hanya_tiket_section_sendiri_dihitung_dan_ditampilkan(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::Completed, ['selesai_pada' => now()]);
        $tiketGa = $this->tiketGa();
        $tiketGa->forceFill(['judul' => 'RAHASIA GA'])->save();

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan()->assertOk();

        $res->assertJsonPath('ringkasan.total', 2)->assertJsonPath('meta.total', 2);
        $this->assertStringNotContainsString('RAHASIA', $res->getContent());
        $this->assertStringNotContainsString($tiketGa->kode_tiket, $res->getContent());

        Sanctum::actingAs($this->supGa);
        $this->laporan()->assertOk()->assertJsonPath('ringkasan.total', 1);
    }

    public function test_klien_tidak_bisa_melebarkan_cakupan_lewat_parameter(): void
    {
        $this->tiket();
        $this->tiketGa();

        Sanctum::actingAs($this->supIs);

        // Semua parameter cakupan dari klien diabaikan; section tetap section supervisor.
        $this->laporan('id_bagian='.$this->bagianGa->id)->assertOk()->assertJsonPath('ringkasan.total', 1);
        $this->laporan('id_bagian[]='.$this->bagianGa->id.'&id_bagian[]='.$this->bagianIs->id)->assertOk()->assertJsonPath('ringkasan.total', 1);
        $this->laporan('id_pic='.$this->picGa->id.'&id_plant=999999')->assertOk()->assertJsonPath('ringkasan.total', 1);
        $this->laporan('id_layanan='.$this->layananGa->id)->assertOk()->assertJsonPath('ringkasan.total', 1);
        $this->laporan('layanan='.$this->layananGa->id)->assertOk()->assertJsonPath('ringkasan.total', 0);
    }

    public function test_supervisor_tanpa_section_mendapat_laporan_kosong(): void
    {
        $this->tiket();
        Sanctum::actingAs(User::factory()->supervisor()->create(['id_bagian' => null]));

        $this->laporan()->assertOk()->assertJsonPath('ringkasan.total', 0)->assertJsonPath('meta.total', 0);
    }

    // ---- Isi ringkasan (PRD Bagian 7) ----------------------------------

    public function test_laporan_kosong_memberi_nol_dan_null_bukan_angka_palsu(): void
    {
        Sanctum::actingAs($this->supIs);

        $this->laporan()->assertOk()
            ->assertJsonPath('ringkasan.total', 0)
            ->assertJsonCount(6, 'ringkasan.per_status')
            ->assertJsonPath('ringkasan.per_layanan', [])
            ->assertJsonPath('ringkasan.per_kategori', [])
            ->assertJsonPath('ringkasan.selesai.rata_rata_jam', null)
            ->assertJsonPath('ringkasan.rata_revisi', null)
            ->assertJsonPath('ringkasan.ditutup_otomatis', 0)
            ->assertJsonPath('ringkasan.tren', []);
    }

    public function test_per_status_per_layanan_dan_per_kategori(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::InProgress);
        $this->tiket(StatusPermintaan::Completed, ['selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Pending, [], $this->layananIs2);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan()->assertOk();

        $res->assertJsonPath('ringkasan.total', 4)
            ->assertJsonPath('ringkasan.per_status.submitted', 1)
            ->assertJsonPath('ringkasan.per_status.in_progress', 1)
            ->assertJsonPath('ringkasan.per_status.pending', 1)
            ->assertJsonPath('ringkasan.per_status.completed', 1)
            ->assertJsonPath('ringkasan.per_status.rejected', 0)
            ->assertJsonPath('ringkasan.per_layanan.0.id', $this->layananIs->id)
            ->assertJsonPath('ringkasan.per_layanan.0.jumlah', 3)
            ->assertJsonPath('ringkasan.per_layanan.0.kategori', 'Dukungan IT')
            ->assertJsonPath('ringkasan.per_layanan.1.id', $this->layananIs2->id)
            ->assertJsonPath('ringkasan.per_layanan.1.jumlah', 1)
            ->assertJsonPath('ringkasan.per_kategori', [
                ['kategori' => 'Dukungan IT', 'jumlah' => 3],
                ['kategori' => 'Jaringan', 'jumlah' => 1],
            ]);
    }

    public function test_rata_rata_durasi_revisi_dan_tanpa_revisi(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['created_at' => '2026-11-02 08:00:00', 'selesai_pada' => '2026-11-02 18:00:00', 'jumlah_revisi' => 0]);
        $this->tiket(StatusPermintaan::Completed, ['created_at' => '2026-11-03 08:00:00', 'selesai_pada' => '2026-11-04 08:00:00', 'jumlah_revisi' => 2]);
        $this->tiket(StatusPermintaan::Submitted, ['created_at' => '2026-11-05 08:00:00', 'jumlah_revisi' => 1]); // tidak masuk durasi, tetap masuk rata revisi

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan()->assertOk();

        $res->assertJsonPath('ringkasan.selesai.jumlah', 2)
            ->assertJsonPath('ringkasan.selesai.rata_rata_jam', 17)          // (10 + 24) / 2 jam
            ->assertJsonPath('ringkasan.selesai.tanpa_revisi_persen', 50)    // 1 dari 2 selesai tanpa revisi
            ->assertJsonPath('ringkasan.rata_revisi', 1);                    // (0 + 2 + 1) / 3

        $this->assertStringNotContainsStringIgnoringCase('sla', $res->getContent());
    }

    public function test_ditutup_otomatis_dihitung_per_tiket_bukan_per_kejadian(): void
    {
        $otomatis = $this->tiket(StatusPermintaan::Completed, ['selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Completed, ['selesai_pada' => now()]);
        $tiketGa = $this->tiketGa();

        foreach ([$otomatis, $otomatis, $tiketGa] as $t) {
            RiwayatPermintaan::forceCreate([
                'id_permintaan' => $t->id, 'id_user' => null, 'status' => StatusPermintaan::Completed,
                'aksi' => AksiRiwayat::AutoClosed, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        Sanctum::actingAs($this->supIs);
        $this->laporan()->assertOk()->assertJsonPath('ringkasan.ditutup_otomatis', 1); // GA tidak ikut; dua kejadian satu tiket
    }

    public function test_ringkasan_mencakup_seluruh_hasil_filter_bukan_hanya_halaman(): void
    {
        foreach (range(1, 7) as $i) {
            $this->tiket(StatusPermintaan::Pending);
        }

        Sanctum::actingAs($this->supIs);
        $this->laporan('per_page=3')->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('ringkasan.total', 7)
            ->assertJsonPath('ringkasan.per_status.pending', 7);
    }

    // ---- Filter --------------------------------------------------------

    public function test_filter_status_layanan_dan_tanggal_dipakai_serentak_pada_rekap_dan_ringkasan(): void
    {
        $cocok = $this->tiket(StatusPermintaan::Pending, ['created_at' => '2026-11-10 09:00:00'], $this->layananIs2);
        $this->tiket(StatusPermintaan::Pending, ['created_at' => '2026-11-10 09:00:00']);               // layanan lain
        $this->tiket(StatusPermintaan::Completed, ['created_at' => '2026-11-10 09:00:00'], $this->layananIs2); // status lain
        $this->tiket(StatusPermintaan::Pending, ['created_at' => '2026-10-10 09:00:00'], $this->layananIs2);   // di luar tanggal

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan('status=pending&layanan='.$this->layananIs2->id.'&dari=2026-11-01&sampai=2026-11-30')->assertOk();

        $this->assertSame([$cocok->id], array_column($res->json('data'), 'id'));
        $res->assertJsonPath('ringkasan.total', 1)->assertJsonPath('ringkasan.per_status.pending', 1);
    }

    public function test_rentang_tanggal_mencakup_seluruh_hari_awal_dan_akhir(): void
    {
        $this->tiket(tambah: ['created_at' => '2026-11-09 23:59:00']);
        $this->tiket(tambah: ['created_at' => '2026-11-10 00:00:00']);
        $this->tiket(tambah: ['created_at' => '2026-11-12 23:59:59']);
        $this->tiket(tambah: ['created_at' => '2026-11-13 00:00:00']);

        Sanctum::actingAs($this->supIs);

        $this->laporan('dari=2026-11-10&sampai=2026-11-12')->assertOk()->assertJsonPath('ringkasan.total', 2);
        $this->laporan('dari=2026-11-12')->assertOk()->assertJsonPath('ringkasan.total', 2);
        $this->laporan('sampai=2026-11-09')->assertOk()->assertJsonPath('ringkasan.total', 1);
    }

    public function test_status_ganda_dipisah_koma(): void
    {
        $this->tiket(StatusPermintaan::Pending);
        $this->tiket(StatusPermintaan::Rejected);
        $this->tiket(StatusPermintaan::Completed, ['selesai_pada' => now()]);

        Sanctum::actingAs($this->supIs);
        $this->laporan('status=pending,rejected')->assertOk()->assertJsonPath('ringkasan.total', 2);
    }

    public function test_parameter_tidak_valid_ditolak_422(): void
    {
        Sanctum::actingAs($this->supIs);

        $this->laporan('dari=10-11-2026')->assertUnprocessable()->assertJsonValidationErrors('dari');
        $this->laporan('sampai=bukan-tanggal')->assertUnprocessable()->assertJsonValidationErrors('sampai');
        $this->laporan('dari=2026-11-12&sampai=2026-11-10')->assertUnprocessable()->assertJsonValidationErrors('sampai');
        $this->laporan('status=selesai')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->laporan('layanan=abc')->assertUnprocessable()->assertJsonValidationErrors('layanan');
        $this->laporan('per_page=101')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    // ---- Tren ----------------------------------------------------------

    public function test_tren_harian_untuk_rentang_pendek_dengan_periode_kosong_tetap_muncul(): void
    {
        $this->tiket(tambah: ['created_at' => '2026-11-10 08:00:00']);
        $this->tiket(tambah: ['created_at' => '2026-11-10 17:00:00']);
        $this->tiket(StatusPermintaan::Completed, ['created_at' => '2026-11-12 09:00:00', 'selesai_pada' => '2026-11-12 12:00:00']);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan('dari=2026-11-10&sampai=2026-11-14')->assertOk();

        $res->assertJsonPath('ringkasan.granularitas', 'hari')->assertJsonCount(5, 'ringkasan.tren');
        $this->assertSame(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'], array_column($res->json('ringkasan.tren'), 'kunci'));
        $this->assertSame([2, 0, 1, 0, 0], array_column($res->json('ringkasan.tren'), 'diajukan'));
        $this->assertSame([0, 0, 1, 0, 0], array_column($res->json('ringkasan.tren'), 'selesai'));
        $res->assertJsonPath('ringkasan.tren.0.label', '10 Nov');
    }

    public function test_tren_mingguan_dimulai_hari_senin(): void
    {
        // 1 Okt 2026 adalah hari Kamis, jadi pekannya dimulai Senin 28 Sep.
        $this->tiket(tambah: ['created_at' => '2026-10-01 08:00:00']);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan('dari=2026-10-01&sampai=2026-12-15')->assertOk(); // 76 hari

        $res->assertJsonPath('ringkasan.granularitas', 'minggu')
            ->assertJsonPath('ringkasan.tren.0.kunci', '2026-09-28')
            ->assertJsonPath('ringkasan.tren.0.diajukan', 1);

        foreach ($res->json('ringkasan.tren') as $pekan) {
            $this->assertSame('Monday', CarbonImmutable::parse($pekan['kunci'])->englishDayOfWeek);
        }
    }

    public function test_tren_bulanan_untuk_rentang_panjang(): void
    {
        $this->tiket(tambah: ['created_at' => '2026-03-15 08:00:00']);
        $this->tiket(tambah: ['created_at' => '2026-03-20 08:00:00']);
        $this->tiket(tambah: ['created_at' => '2026-11-02 08:00:00']);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan('dari=2026-01-01&sampai=2026-11-30')->assertOk(); // 334 hari

        $res->assertJsonPath('ringkasan.granularitas', 'bulan')->assertJsonCount(11, 'ringkasan.tren');
        $baris = collect($res->json('ringkasan.tren'))->keyBy('kunci');
        $this->assertSame(2, $baris['2026-03']['diajukan']);
        $this->assertSame(1, $baris['2026-11']['diajukan']);
        $this->assertSame(0, $baris['2026-07']['diajukan']);
        $this->assertSame('Mar 2026', $baris['2026-03']['label']);
    }

    public function test_tren_tanpa_rentang_memakai_tanggal_tiket_terawal_dan_terakhir(): void
    {
        $this->tiket(tambah: ['created_at' => '2026-11-10 08:00:00']);
        $this->tiket(tambah: ['created_at' => '2026-11-12 08:00:00']);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan()->assertOk();

        $this->assertSame(['2026-11-10', '2026-11-11', '2026-11-12'], array_column($res->json('ringkasan.tren'), 'kunci'));
    }

    // ---- Rekap ---------------------------------------------------------

    public function test_baris_rekap_berurutan_terbaru_dulu_dan_memuat_pengaju_dan_pic(): void
    {
        $lama = $this->tiket(tambah: ['created_at' => '2026-11-01 08:00:00']);
        $baru = $this->tiket(StatusPermintaan::InProgress, ['created_at' => '2026-11-05 08:00:00', 'id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->supIs);
        $res = $this->laporan()->assertOk();

        $this->assertSame([$baru->id, $lama->id], array_column($res->json('data'), 'id'));
        $res->assertJsonPath('data.0.pengaju', $this->karyawan->name)
            ->assertJsonPath('data.0.pic', $this->picIs->name)
            ->assertJsonPath('data.0.status_label', 'Sedang Diproses')
            ->assertJsonPath('data.1.pic', null)
            ->assertJsonStructure(['data' => [['id', 'kode_tiket', 'judul', 'status', 'layanan', 'pengaju', 'pic', 'dibuat_pada']], 'meta', 'links', 'ringkasan' => ['total', 'per_status', 'per_layanan', 'per_kategori', 'selesai', 'rata_revisi', 'ditutup_otomatis', 'granularitas', 'tren']]);
    }
}
