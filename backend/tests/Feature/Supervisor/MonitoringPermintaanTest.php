<?php

namespace Tests\Feature\Supervisor;

use App\Enums\AksiRiwayat;
use App\Enums\JenisLampiran;
use App\Enums\StatusPermintaan;
use App\Models\Lampiran;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/supervisor/permintaan dan /api/supervisor/permintaan/{id}: hanya tiket section sendiri. */
class MonitoringPermintaanTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    /** Tiket yang ditujukan ke section IS (milik supervisor IS). */
    private function tiketIs(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], ?User $pengaju = null): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => ($pengaju ?? $this->karyawan)->id,
            'status' => $status,
        ] + $tambah);
    }

    private function url(string $query = ''): string
    {
        return '/api/supervisor/permintaan'.($query === '' ? '' : '?'.$query);
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_supervisor(): void
    {
        $tiket = $this->tiketIs();

        $this->getJson($this->url())->assertUnauthorized();
        $this->getJson($this->url().'/'.$tiket->id)->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson($this->url())->assertForbidden();
            $this->getJson('/api/supervisor/permintaan/'.$tiket->id)->assertForbidden();
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->supIs->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->supIs->fresh());

        $this->getJson($this->url())->assertForbidden();
    }

    // ---- Cakupan section (A1) ------------------------------------------

    public function test_hanya_tiket_section_sendiri_dan_tidak_bocor(): void
    {
        $milikIs = $this->tiketIs(tambah: ['judul' => 'Tiket IS']);
        $tiketGa = $this->tiketGa();
        $tiketGa->forceFill(['judul' => 'RAHASIA GA'])->save();

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson($this->url())->assertOk();

        $this->assertSame([$milikIs->id], array_column($res->json('data'), 'id'));
        $this->assertStringNotContainsString('RAHASIA', $res->getContent());
        $this->assertStringNotContainsString($tiketGa->kode_tiket, $res->getContent());

        Sanctum::actingAs($this->supGa);
        $this->getJson($this->url())->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $tiketGa->id);
    }

    public function test_semua_status_tampil_termasuk_yang_menunggu_pic(): void
    {
        foreach (StatusPermintaan::cases() as $status) {
            $this->tiketIs($status);
        }

        Sanctum::actingAs($this->supIs);
        $this->getJson($this->url())->assertOk()->assertJsonPath('meta.total', 6);
    }

    public function test_supervisor_tanpa_section_melihat_daftar_kosong(): void
    {
        $this->tiketIs();
        Sanctum::actingAs(User::factory()->supervisor()->create(['id_bagian' => null]));

        $this->getJson($this->url())->assertOk()->assertJsonPath('meta.total', 0);
    }

    // ---- Isi dan urutan ------------------------------------------------

    public function test_bentuk_baris_dengan_pengaju_pic_dan_label_umum(): void
    {
        $tiket = $this->tiketIs(StatusPermintaan::Submitted);
        $diproses = $this->tiketIs(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson($this->url('per_page=10'))->assertOk();
        $baris = collect($res->json('data'))->keyBy('id');

        $this->assertSame('Menunggu Pemeriksaan', $baris[$tiket->id]['status_label'], 'label umum, bukan "Diajukan" milik karyawan');
        $this->assertNull($baris[$tiket->id]['pic']);
        $this->assertSame($this->picIs->name, $baris[$diproses->id]['pic']);
        $this->assertSame($this->karyawan->name, $baris[$tiket->id]['pengaju']);

        $res->assertJsonStructure(['data' => [['id', 'kode_tiket', 'judul', 'status', 'status_label', 'prioritas', 'prioritas_label', 'layanan' => ['id', 'nama_layanan', 'kategori'], 'pengaju', 'pic', 'lokasi' => ['plant', 'lantai'], 'dibuat_pada']], 'meta', 'links']);
        $this->assertStringNotContainsString('email', $res->getContent());
    }

    public function test_terbaru_dulu(): void
    {
        $lama = $this->tiketIs(tambah: ['created_at' => now()->subDay()]);
        $baru = $this->tiketIs();

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson($this->url())->assertOk();

        $this->assertSame([$baru->id, $lama->id], array_column($res->json('data'), 'id'));
    }

    // ---- Filter --------------------------------------------------------

    public function test_filter_status_tunggal_dan_ganda(): void
    {
        $this->tiketIs(StatusPermintaan::Submitted);
        $this->tiketIs(StatusPermintaan::InProgress);
        $this->tiketIs(StatusPermintaan::Pending);
        $this->tiketIs(StatusPermintaan::Completed);

        Sanctum::actingAs($this->supIs);

        $this->getJson($this->url('status=completed'))->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson($this->url('status=in_progress,pending'))->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson($this->url('status=selesai'))->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_filter_layanan(): void
    {
        $lain = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id]);
        $this->tiketIs();
        Permintaan::factory()->create(['id_layanan' => $lain->id, 'id_karyawan' => $this->karyawan->id]);

        Sanctum::actingAs($this->supIs);

        $this->getJson($this->url('layanan='.$lain->id))->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson($this->url('layanan=abc'))->assertUnprocessable()->assertJsonValidationErrors('layanan');
    }

    public function test_filter_rentang_tanggal_termasuk_seluruh_hari_akhir(): void
    {
        $this->tiketIs(tambah: ['created_at' => '2026-11-09 23:59:00']);
        $dalam1 = $this->tiketIs(tambah: ['created_at' => '2026-11-10 00:00:00']);
        $dalam2 = $this->tiketIs(tambah: ['created_at' => '2026-11-12 23:59:59']);
        $this->tiketIs(tambah: ['created_at' => '2026-11-13 00:00:00']);

        Sanctum::actingAs($this->supIs);

        $res = $this->getJson($this->url('dari=2026-11-10&sampai=2026-11-12'))->assertOk();
        $this->assertEqualsCanonicalizing([$dalam1->id, $dalam2->id], array_column($res->json('data'), 'id'));

        $this->getJson($this->url('dari=2026-11-12'))->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson($this->url('sampai=2026-11-09'))->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_tanggal_tidak_valid_ditolak(): void
    {
        Sanctum::actingAs($this->supIs);

        $this->getJson($this->url('dari=10-11-2026'))->assertUnprocessable()->assertJsonValidationErrors('dari');
        $this->getJson($this->url('sampai=bukan-tanggal'))->assertUnprocessable()->assertJsonValidationErrors('sampai');
        $this->getJson($this->url('dari=2026-11-12&sampai=2026-11-10'))->assertUnprocessable()->assertJsonValidationErrors('sampai');
    }

    public function test_pencarian_nomor_judul_atau_nama_pengaju(): void
    {
        $vpn = $this->tiketIs(tambah: ['kode_tiket' => 'IS-2026-0007', 'judul' => 'Akses VPN rumah']);
        $this->tiketIs(tambah: ['kode_tiket' => 'IS-2026-0008', 'judul' => 'Printer rusak'], pengaju: $this->karyawanLain);
        $this->karyawanLain->update(['name' => 'Budi Pengaju Unik']);

        Sanctum::actingAs($this->supIs);

        $this->getJson($this->url('q=VPN'))->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $vpn->id);
        $this->getJson($this->url('q=0008'))->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson($this->url('q=Pengaju Unik'))->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.kode_tiket', 'IS-2026-0008');
        $this->getJson($this->url('q=tidak-ada'))->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_gabungan_filter_dan_paginasi(): void
    {
        foreach (range(1, 12) as $i) {
            $this->tiketIs(StatusPermintaan::Pending, ['created_at' => '2026-11-10 10:00:00']);
        }
        $this->tiketIs(StatusPermintaan::Completed, ['created_at' => '2026-11-10 10:00:00']);

        Sanctum::actingAs($this->supIs);

        $this->getJson($this->url('status=pending&dari=2026-11-10&sampai=2026-11-10'))
            ->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 12)->assertJsonPath('meta.last_page', 2);
        $this->getJson($this->url('status=pending&page=2'))->assertOk()->assertJsonCount(2, 'data');
        $this->getJson($this->url('per_page=500'))->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    // ---- Detail --------------------------------------------------------

    public function test_detail_lengkap_read_only(): void
    {
        $tiket = $this->tiketIs(StatusPermintaan::WaitingReview, [
            'id_pic' => $this->picIs->id, 'catatan_hasil' => 'Sudah diperbaiki.', 'dikirim_pada' => now(), 'jumlah_revisi' => 1,
        ]);
        Lampiran::create(['id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id, 'jenis' => JenisLampiran::Pengajuan, 'nama_file' => 'foto.jpg', 'path_file' => 'x/a.jpg', 'tipe_file' => 'image/jpeg', 'ukuran_file' => 1000]);
        Lampiran::create(['id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id, 'jenis' => JenisLampiran::Penyelesaian, 'putaran' => 1, 'nama_file' => 'bukti.png', 'path_file' => 'x/b.png', 'tipe_file' => 'image/png', 'ukuran_file' => 2000]);
        RiwayatPermintaan::forceCreate(['id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id, 'status' => StatusPermintaan::Submitted, 'aksi' => AksiRiwayat::Submitted, 'created_at' => now()->subHour(), 'updated_at' => now()->subHour()]);
        RiwayatPermintaan::forceCreate(['id_permintaan' => $tiket->id, 'id_user' => null, 'status' => StatusPermintaan::WaitingReview, 'aksi' => AksiRiwayat::ResultSent, 'created_at' => now(), 'updated_at' => now()]);

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson('/api/supervisor/permintaan/'.$tiket->id)->assertOk();

        $res->assertJsonPath('data.kode_tiket', $tiket->kode_tiket)
            ->assertJsonPath('data.status_label', 'Menunggu Konfirmasi')
            ->assertJsonPath('data.pengaju.name', $this->karyawan->name)
            ->assertJsonPath('data.pic.name', $this->picIs->name)
            ->assertJsonPath('data.jumlah_revisi', 1)
            ->assertJsonCount(1, 'data.lampiran')
            ->assertJsonPath('data.hasil_kerja.catatan', 'Sudah diperbaiki.')
            ->assertJsonPath('data.hasil_kerja.putaran.0.berkas.0.nama_file', 'bukti.png')
            ->assertJsonCount(2, 'data.riwayat')
            ->assertJsonPath('data.riwayat.1.pelaku', 'Sistem')
            ->assertJsonMissingPath('data.bisa_ditinjau');

        $this->assertStringNotContainsString($this->karyawan->email, $res->getContent());
    }

    public function test_detail_tiket_menunggu_pic_tetap_bisa_dilihat(): void
    {
        $tiket = $this->tiketIs(StatusPermintaan::Submitted);

        Sanctum::actingAs($this->supIs);
        $this->getJson('/api/supervisor/permintaan/'.$tiket->id)->assertOk()->assertJsonPath('data.status', 'submitted')->assertJsonPath('data.pic', null);
    }

    public function test_detail_section_lain_atau_tidak_ada_memberi_404(): void
    {
        $milikGa = $this->tiketGa();

        Sanctum::actingAs($this->supIs);

        $this->getJson('/api/supervisor/permintaan/'.$milikGa->id)->assertNotFound();
        $this->getJson('/api/supervisor/permintaan/999999')->assertNotFound();
        $this->getJson('/api/supervisor/permintaan/abc')->assertNotFound();
    }

    public function test_supervisor_tidak_bisa_mengubah_tiket(): void
    {
        $tiket = $this->tiketIs(StatusPermintaan::WaitingReview, ['id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->supIs);

        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertForbidden();
        $this->postJson('/api/supervisor/permintaan/'.$tiket->id, [])->assertStatus(405);
        $this->assertSame(StatusPermintaan::WaitingReview, $tiket->fresh()->status);
    }
}
