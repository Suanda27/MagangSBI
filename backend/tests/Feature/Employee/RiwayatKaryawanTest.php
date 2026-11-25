<?php

namespace Tests\Feature\Employee;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/employee/riwayat: log aktivitas seluruh tiket milik sendiri. */
class RiwayatKaryawanTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(?User $pengaju = null, array $tambah = []): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => ($pengaju ?? $this->karyawan)->id,
        ] + $tambah);
    }

    private function kejadian(Permintaan $tiket, AksiRiwayat $aksi, StatusPermintaan $status, ?User $pelaku = null, ?string $waktu = null, ?string $keterangan = null): RiwayatPermintaan
    {
        return RiwayatPermintaan::forceCreate([
            'id_permintaan' => $tiket->id,
            'id_user' => $pelaku?->id,
            'status' => $status,
            'aksi' => $aksi,
            'keterangan' => $keterangan,
            'created_at' => $waktu ?? now(),
            'updated_at' => $waktu ?? now(),
        ]);
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_karyawan(): void
    {
        $this->getJson('/api/employee/riwayat')->assertUnauthorized();

        foreach ([$this->picIs, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson('/api/employee/riwayat')->assertForbidden();
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->karyawan->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->karyawan->fresh());

        $this->getJson('/api/employee/riwayat')->assertForbidden();
    }

    // ---- Isi dan cakupan -----------------------------------------------

    public function test_kosong_bila_belum_ada_aktivitas(): void
    {
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }

    public function test_hanya_kejadian_tiket_milik_sendiri_dan_tidak_membocorkan_milik_lain(): void
    {
        $saya = $this->tiket(tambah: ['judul' => 'Tiket saya']);
        $lain = $this->tiket($this->karyawanLain, ['judul' => 'RAHASIA orang lain']);
        $this->kejadian($saya, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan);
        $this->kejadian($lain, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawanLain);

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/riwayat')->assertOk();

        $res->assertJsonCount(1, 'data')->assertJsonPath('meta.total', 1);
        $this->assertStringNotContainsString('RAHASIA', $res->getContent());
        $this->assertStringNotContainsString($lain->kode_tiket, $res->getContent());
    }

    public function test_bentuk_baris_dan_pelaku_sistem(): void
    {
        $tiket = $this->tiket(tambah: ['judul' => 'AC bocor']);
        $this->kejadian($tiket, AksiRiwayat::Accepted, StatusPermintaan::InProgress, $this->picIs, keterangan: 'Segera dikerjakan');
        $this->kejadian($tiket, AksiRiwayat::AutoClosed, StatusPermintaan::Completed, null, now()->addMinute()->toDateTimeString());

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/riwayat')->assertOk();

        $res->assertJsonPath('data.0.aksi', 'auto_closed')
            ->assertJsonPath('data.0.judul', 'Ditutup Otomatis oleh Sistem')
            ->assertJsonPath('data.0.pelaku', 'Sistem')
            ->assertJsonPath('data.0.status', 'completed')
            ->assertJsonPath('data.0.status_label', 'Selesai')
            ->assertJsonPath('data.1.pelaku', $this->picIs->name)
            ->assertJsonPath('data.1.keterangan', 'Segera dikerjakan')
            ->assertJsonPath('data.1.tiket.id', $tiket->id)
            ->assertJsonPath('data.1.tiket.kode_tiket', $tiket->kode_tiket)
            ->assertJsonPath('data.1.tiket.judul', 'AC bocor')
            ->assertJsonPath('data.1.tiket.layanan', $this->layananIs->nama_layanan)
            ->assertJsonStructure(['data' => [['id', 'aksi', 'judul', 'status', 'status_label', 'pelaku', 'keterangan', 'waktu', 'tiket' => ['id', 'kode_tiket', 'judul', 'layanan']]], 'meta', 'links']);
    }

    public function test_label_status_untuk_karyawan_memakai_diajukan(): void
    {
        $tiket = $this->tiket();
        $this->kejadian($tiket, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan);

        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/employee/riwayat')->assertOk()->assertJsonPath('data.0.status_label', 'Diajukan');
    }

    public function test_urutan_terbaru_dulu_lintas_tiket(): void
    {
        $a = $this->tiket();
        $b = $this->tiket();
        $e1 = $this->kejadian($a, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan, '2026-11-10 08:00:00');
        $e2 = $this->kejadian($b, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan, '2026-11-12 08:00:00');
        $e3 = $this->kejadian($a, AksiRiwayat::Accepted, StatusPermintaan::InProgress, $this->picIs, '2026-11-11 08:00:00');

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/employee/riwayat')->assertOk();

        $this->assertSame([$e2->id, $e3->id, $e1->id], array_column($res->json('data'), 'id'));
    }

    // ---- Filter --------------------------------------------------------

    public function test_filter_status_tunggal_dan_ganda(): void
    {
        $t = $this->tiket();
        $this->kejadian($t, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan);
        $this->kejadian($t, AksiRiwayat::Accepted, StatusPermintaan::InProgress, $this->picIs);
        $this->kejadian($t, AksiRiwayat::Paused, StatusPermintaan::Pending, $this->picIs);
        $this->kejadian($t, AksiRiwayat::Approved, StatusPermintaan::Completed, $this->karyawan);

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat?status=completed')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/riwayat?status=in_progress,pending')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/employee/riwayat?status=')->assertOk()->assertJsonPath('meta.total', 4);
        $this->getJson('/api/employee/riwayat?status=selesai')->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_filter_bulan(): void
    {
        $t = $this->tiket();
        $this->kejadian($t, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan, '2026-10-31 23:30:00');
        $this->kejadian($t, AksiRiwayat::Accepted, StatusPermintaan::InProgress, $this->picIs, '2026-11-01 00:30:00');
        $this->kejadian($t, AksiRiwayat::Approved, StatusPermintaan::Completed, $this->karyawan, '2026-11-30 22:00:00');
        $this->kejadian($t, AksiRiwayat::Paused, StatusPermintaan::Pending, $this->picIs, '2026-12-01 00:10:00');

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat?bulan=2026-11')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/employee/riwayat?bulan=2026-10')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/riwayat?bulan=2027-01')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_bulan_tidak_valid_ditolak(): void
    {
        Sanctum::actingAs($this->karyawan);

        foreach (['2026-13', '2026-00', '26-11', 'november', '2026-1', '2026-11-05'] as $salah) {
            $this->getJson('/api/employee/riwayat?bulan='.$salah)->assertUnprocessable()->assertJsonValidationErrors('bulan');
        }
    }

    public function test_pencarian_nomor_tiket_atau_judul_tiket(): void
    {
        $vpn = $this->tiket(tambah: ['kode_tiket' => 'IS-2026-0007', 'judul' => 'Akses VPN rumah']);
        $printer = $this->tiket(tambah: ['kode_tiket' => 'IS-2026-0008', 'judul' => 'Printer rusak']);
        $this->kejadian($vpn, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan);
        $this->kejadian($printer, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan);

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat?q=VPN')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.tiket.kode_tiket', 'IS-2026-0007');
        $this->getJson('/api/employee/riwayat?q=0008')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/riwayat?q=tidak-ada')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_filter_layanan_dan_gabungan_filter(): void
    {
        $is = $this->tiket();
        $ga = Permintaan::factory()->create(['id_layanan' => $this->layananGa->id, 'id_karyawan' => $this->karyawan->id]);
        $this->kejadian($is, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan, '2026-11-05 10:00:00');
        $this->kejadian($ga, AksiRiwayat::Submitted, StatusPermintaan::Submitted, $this->karyawan, '2026-11-05 11:00:00');
        $this->kejadian($ga, AksiRiwayat::Accepted, StatusPermintaan::InProgress, $this->picGa, '2026-11-06 11:00:00');

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat?layanan='.$this->layananGa->id)->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/employee/riwayat?layanan='.$this->layananGa->id.'&status=in_progress&bulan=2026-11')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/employee/riwayat?layanan=abc')->assertUnprocessable()->assertJsonValidationErrors('layanan');
    }

    // ---- Paginasi ------------------------------------------------------

    public function test_paginasi(): void
    {
        $t = $this->tiket();
        foreach (range(1, 12) as $i) {
            $this->kejadian($t, AksiRiwayat::Paused, StatusPermintaan::Pending, $this->picIs, now()->subMinutes(100 - $i)->toDateTimeString());
        }

        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/employee/riwayat')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.total', 12);
        $this->getJson('/api/employee/riwayat?page=2')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.from', 11);
        $this->getJson('/api/employee/riwayat?per_page=5')->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('meta.last_page', 3);
        $this->getJson('/api/employee/riwayat?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }
}
