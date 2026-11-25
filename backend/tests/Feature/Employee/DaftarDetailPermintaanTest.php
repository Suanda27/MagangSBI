<?php

namespace Tests\Feature\Employee;

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

/** GET /api/employee/permintaan dan /api/employee/permintaan/{id}. */
class DaftarDetailPermintaanTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], ?User $pengaju = null): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => ($pengaju ?? $this->karyawan)->id,
            'status' => $status,
        ] + $tambah);
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_karyawan(): void
    {
        $tiket = $this->tiket();

        $this->getJson('/api/employee/permintaan')->assertUnauthorized();
        $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertUnauthorized();

        foreach ([$this->picIs, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson('/api/employee/permintaan')->assertForbidden();
            $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertForbidden();
        }
    }

    // ---- Daftar --------------------------------------------------------

    public function test_hanya_menampilkan_tiket_milik_sendiri_terbaru_dulu(): void
    {
        $lama = $this->tiket(tambah: ['created_at' => now()->subDay()]);
        $baru = $this->tiket();
        $this->tiket(pengaju: $this->karyawanLain); // bukan milik saya

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/permintaan')->assertOk();

        $this->assertSame([$baru->id, $lama->id], array_column($res->json('data'), 'id'));
        $res->assertJsonPath('meta.total', 2)
            ->assertJsonStructure(['data' => [['id', 'kode_tiket', 'judul', 'status', 'status_label', 'prioritas', 'layanan', 'bagian', 'lokasi', 'dibuat_pada']], 'links', 'meta' => ['current_page', 'last_page', 'per_page', 'total']]);
    }

    public function test_daftar_kosong(): void
    {
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }

    public function test_filter_status_tunggal_dan_ganda(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::InProgress);
        $this->tiket(StatusPermintaan::Pending);
        $this->tiket(StatusPermintaan::Completed);

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan?status=completed')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/permintaan?status=in_progress,pending')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/employee/permintaan?status=')->assertOk()->assertJsonPath('meta.total', 4);
    }

    public function test_status_tidak_valid_ditolak(): void
    {
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan?status=selesai')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->getJson('/api/employee/permintaan?status=pending,ngawur')->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_pencarian_nomor_tiket_atau_judul(): void
    {
        $this->tiket(tambah: ['kode_tiket' => 'IS-2026-0007', 'judul' => 'Akses VPN rumah']);
        $this->tiket(tambah: ['kode_tiket' => 'IS-2026-0008', 'judul' => 'Printer rusak']);
        $this->tiket(tambah: ['kode_tiket' => 'IS-2026-0009', 'judul' => 'Printer lantai dua'], pengaju: $this->karyawanLain);

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan?q=VPN')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.kode_tiket', 'IS-2026-0007');
        $this->getJson('/api/employee/permintaan?q=0008')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/permintaan?q=printer')->assertOk()->assertJsonPath('meta.total', 1); // milik orang lain tidak ikut
        $this->getJson('/api/employee/permintaan?q=tidak-ada')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_filter_layanan(): void
    {
        $this->tiket();
        Permintaan::factory()->create(['id_layanan' => $this->layananGa->id, 'id_karyawan' => $this->karyawan->id]);

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan?layanan='.$this->layananGa->id)->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/permintaan?layanan=abc')->assertUnprocessable()->assertJsonValidationErrors('layanan');
    }

    public function test_filter_digabung(): void
    {
        $cocok = $this->tiket(StatusPermintaan::Pending, ['judul' => 'Mesin macet']);
        $this->tiket(StatusPermintaan::Pending, ['judul' => 'Lampu mati']);
        $this->tiket(StatusPermintaan::Completed, ['judul' => 'Mesin macet lama']);

        Sanctum::actingAs($this->karyawan);

        $res = $this->getJson('/api/employee/permintaan?status=pending&q=mesin&layanan='.$this->layananIs->id)->assertOk();
        $this->assertSame([$cocok->id], array_column($res->json('data'), 'id'));
    }

    public function test_paginasi(): void
    {
        foreach (range(1, 12) as $i) {
            $this->tiket(tambah: ['created_at' => now()->subMinutes(100 - $i)]);
        }

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan')->assertOk()
            ->assertJsonCount(10, 'data')->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.total', 12);
        $this->getJson('/api/employee/permintaan?page=2')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.current_page', 2);
        $this->getJson('/api/employee/permintaan?per_page=5')->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('meta.last_page', 3);
        $this->getJson('/api/employee/permintaan?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/employee/permintaan?page=0')->assertUnprocessable()->assertJsonValidationErrors('page');
    }

    // ---- Detail --------------------------------------------------------

    public function test_detail_tiket_sendiri_lengkap(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview, [
            'id_pic' => $this->picIs->id, 'catatan_hasil' => 'AC sudah diperbaiki.', 'dikirim_pada' => now(),
            'jumlah_revisi' => 1, 'alasan_revisi' => 'Masih menetes sedikit.', 'diterima_pada' => now()->subDay(),
        ]);
        $pengajuan = Lampiran::create(['id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id, 'jenis' => JenisLampiran::Pengajuan, 'nama_file' => 'foto.jpg', 'path_file' => 'lampiran/x/a.jpg', 'tipe_file' => 'image/jpeg', 'ukuran_file' => 1000]);
        Lampiran::create(['id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id, 'jenis' => JenisLampiran::Penyelesaian, 'putaran' => 2, 'nama_file' => 'bukti2.png', 'path_file' => 'lampiran/x/c.png', 'tipe_file' => 'image/png', 'ukuran_file' => 2000]);
        Lampiran::create(['id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id, 'jenis' => JenisLampiran::Penyelesaian, 'putaran' => 1, 'nama_file' => 'bukti1.png', 'path_file' => 'lampiran/x/b.png', 'tipe_file' => 'image/png', 'ukuran_file' => 1500]);

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertOk();

        $res->assertJsonPath('data.kode_tiket', $tiket->kode_tiket)
            ->assertJsonPath('data.status', 'waiting_review')
            ->assertJsonPath('data.status_label', 'Menunggu Konfirmasi')
            ->assertJsonPath('data.bisa_ditinjau', true)
            ->assertJsonPath('data.pic.name', $this->picIs->name)
            ->assertJsonPath('data.bagian.kode_bagian', 'IS')
            ->assertJsonPath('data.jumlah_revisi', 1)
            ->assertJsonPath('data.alasan_revisi', 'Masih menetes sedikit.')
            // lampiran pengajuan terpisah dari hasil kerja
            ->assertJsonCount(1, 'data.lampiran')
            ->assertJsonPath('data.lampiran.0.id', $pengajuan->id)
            ->assertJsonPath('data.lampiran.0.url', url('/api/lampiran/'.$pengajuan->id))
            // semua putaran terlihat dan berurutan
            ->assertJsonPath('data.hasil_kerja.catatan', 'AC sudah diperbaiki.')
            ->assertJsonCount(2, 'data.hasil_kerja.putaran')
            ->assertJsonPath('data.hasil_kerja.putaran.0.putaran', 1)
            ->assertJsonPath('data.hasil_kerja.putaran.0.berkas.0.nama_file', 'bukti1.png')
            ->assertJsonPath('data.hasil_kerja.putaran.1.putaran', 2);
    }

    public function test_bisa_ditinjau_hanya_saat_menunggu_konfirmasi(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress);
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertOk()->assertJsonPath('data.bisa_ditinjau', false);
    }

    public function test_timeline_riwayat_berurutan_dengan_pelaku_dan_sistem(): void
    {
        $tiket = $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        RiwayatPermintaan::create(['id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id, 'status' => StatusPermintaan::Submitted, 'aksi' => AksiRiwayat::Submitted, 'created_at' => now()->subHours(3)]);
        RiwayatPermintaan::create(['id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id, 'status' => StatusPermintaan::InProgress, 'aksi' => AksiRiwayat::Accepted, 'keterangan' => 'Segera dikerjakan', 'created_at' => now()->subHours(2)]);
        RiwayatPermintaan::create(['id_permintaan' => $tiket->id, 'id_user' => null, 'status' => StatusPermintaan::Completed, 'aksi' => AksiRiwayat::AutoClosed, 'created_at' => now()->subHour()]);

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertOk()->assertJsonCount(3, 'data.riwayat');

        $this->assertSame(['submitted', 'accepted', 'auto_closed'], array_column($res->json('data.riwayat'), 'aksi'));
        $res->assertJsonPath('data.riwayat.0.pelaku', $this->karyawan->name)
            ->assertJsonPath('data.riwayat.0.judul', 'Permintaan Diajukan')
            ->assertJsonPath('data.riwayat.1.keterangan', 'Segera dikerjakan')
            ->assertJsonPath('data.riwayat.2.pelaku', 'Sistem');
    }

    public function test_tiket_orang_lain_dan_yang_tidak_ada_memberi_404(): void
    {
        $milikLain = $this->tiket(pengaju: $this->karyawanLain);
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/permintaan/'.$milikLain->id)->assertNotFound();
        $this->getJson('/api/employee/permintaan/999999')->assertNotFound();
        $this->getJson('/api/employee/permintaan/abc')->assertNotFound();
    }

    public function test_detail_tidak_membocorkan_data_sensitif_pic(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Sanctum::actingAs($this->karyawan);

        $res = $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertOk();

        $this->assertStringNotContainsString($this->picIs->email, $res->getContent());
        $this->assertStringNotContainsString('password', $res->getContent());
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $tiket = $this->tiket();
        $this->karyawan->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->karyawan->fresh());

        $this->getJson('/api/employee/permintaan')->assertForbidden();
        $this->getJson('/api/employee/permintaan/'.$tiket->id)->assertForbidden();
    }

    public function test_layanan_baru_di_factory_tidak_mengubah_filter(): void
    {
        // Pastikan filter layanan memakai id, bukan nama: dua layanan bernama sama tidak tertukar.
        $kembar = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id, 'nama_layanan' => $this->layananIs->nama_layanan.' ']);
        $this->tiket();
        Permintaan::factory()->create(['id_layanan' => $kembar->id, 'id_karyawan' => $this->karyawan->id]);

        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/employee/permintaan?layanan='.$kembar->id)->assertOk()->assertJsonPath('meta.total', 1);
    }
}
