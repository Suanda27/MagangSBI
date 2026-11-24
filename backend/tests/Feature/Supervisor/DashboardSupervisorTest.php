<?php

namespace Tests\Feature\Supervisor;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/supervisor/dashboard: hanya tiket section supervisor, tanpa SLA. */
class DashboardSupervisorTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiketIsStatus(StatusPermintaan $status, array $tambah = []): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    public function test_butuh_login_dan_hanya_untuk_supervisor(): void
    {
        $this->getJson('/api/supervisor/dashboard')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson('/api/supervisor/dashboard')->assertForbidden();
        }
    }

    public function test_dashboard_kosong(): void
    {
        Sanctum::actingAs($this->supIs);

        $this->getJson('/api/supervisor/dashboard')
            ->assertOk()
            ->assertJsonPath('data.bagian.kode_bagian', 'IS')
            ->assertJsonPath('data.total', 0)
            ->assertJsonPath('data.berjalan', 0)
            ->assertJsonPath('data.rasio_selesai', null)
            ->assertJsonPath('data.rata_durasi_jam', null)
            ->assertJsonPath('data.rata_revisi', null)
            ->assertJsonCount(6, 'data.per_status')
            ->assertJsonCount(0, 'data.terbaru')
            ->assertJsonCount(0, 'data.aktivitas');
    }

    public function test_hanya_menghitung_tiket_section_sendiri(): void
    {
        $this->tiketIsStatus(StatusPermintaan::Submitted);
        $this->tiketIsStatus(StatusPermintaan::Submitted);
        $this->tiketIsStatus(StatusPermintaan::Completed, ['selesai_pada' => now()]);
        $this->tiketGa(); // tujuan GA: tidak boleh terhitung untuk supervisor IS

        Sanctum::actingAs($this->supIs);
        $this->getJson('/api/supervisor/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.per_status.submitted', 2)
            ->assertJsonPath('data.per_status.completed', 1)
            ->assertJsonPath('data.berjalan', 2)
            ->assertJsonPath('data.rasio_selesai', 33.3);

        Sanctum::actingAs($this->supGa);
        $this->getJson('/api/supervisor/dashboard')
            ->assertOk()
            ->assertJsonPath('data.bagian.kode_bagian', 'GA')
            ->assertJsonPath('data.total', 1);
    }

    public function test_tiket_dan_aktivitas_section_lain_tidak_bocor(): void
    {
        $tiketGa = $this->tiketGa();
        $tiketGa->forceFill(['judul' => 'RAHASIA-GA'])->save();
        RiwayatPermintaan::create([
            'id_permintaan' => $tiketGa->id, 'id_user' => $this->karyawan->id,
            'status' => StatusPermintaan::Submitted, 'aksi' => AksiRiwayat::Submitted,
        ]);
        $this->tiketIsStatus(StatusPermintaan::Submitted);

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson('/api/supervisor/dashboard')->assertOk();

        $this->assertStringNotContainsString('RAHASIA-GA', $res->getContent());
        $this->assertStringNotContainsString($tiketGa->kode_tiket, $res->getContent());
        $res->assertJsonCount(1, 'data.terbaru')->assertJsonCount(0, 'data.aktivitas');
    }

    public function test_terbaru_maksimal_6_dan_memuat_nama_pengaju_dan_pic(): void
    {
        foreach (range(1, 8) as $i) {
            $t = $this->tiketIsStatus(StatusPermintaan::Submitted);
            $t->forceFill(['created_at' => now()->subMinutes(20 - $i)])->save();
            if ($i === 8) {
                $terakhir = $t;
            }
        }
        $terakhir->forceFill(['status' => StatusPermintaan::InProgress, 'id_pic' => $this->picIs->id])->save();

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson('/api/supervisor/dashboard')->assertOk()->assertJsonCount(6, 'data.terbaru');

        $res->assertJsonPath('data.terbaru.0.id', $terakhir->id)
            ->assertJsonPath('data.terbaru.0.pengaju', $this->karyawan->name)
            ->assertJsonPath('data.terbaru.0.pic', $this->picIs->name)
            ->assertJsonPath('data.terbaru.0.status_label', 'Sedang Diproses')
            ->assertJsonPath('data.terbaru.1.pic', null);
    }

    public function test_aktivitas_terbaru_dari_riwayat_section_sendiri(): void
    {
        $tiket = $this->tiketIsStatus(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        RiwayatPermintaan::create([
            'id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id,
            'status' => StatusPermintaan::Submitted, 'aksi' => AksiRiwayat::Submitted,
        ]);
        RiwayatPermintaan::create([
            'id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id,
            'status' => StatusPermintaan::InProgress, 'aksi' => AksiRiwayat::Accepted,
        ]);
        RiwayatPermintaan::create([
            'id_permintaan' => $tiket->id, 'id_user' => null,
            'status' => StatusPermintaan::Completed, 'aksi' => AksiRiwayat::AutoClosed,
        ]);

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson('/api/supervisor/dashboard')->assertOk()->assertJsonCount(3, 'data.aktivitas');

        $res->assertJsonPath('data.aktivitas.0.aksi', 'auto_closed')
            ->assertJsonPath('data.aktivitas.0.pelaku', 'Sistem')
            ->assertJsonPath('data.aktivitas.0.judul', 'Ditutup Otomatis oleh Sistem')
            ->assertJsonPath('data.aktivitas.1.pelaku', $this->picIs->name)
            ->assertJsonPath('data.aktivitas.2.kode_tiket', $tiket->kode_tiket);
    }

    public function test_rata_durasi_dan_rata_revisi_tanpa_sla(): void
    {
        $this->tiketIsStatus(StatusPermintaan::Completed, [
            'created_at' => now()->subHours(10), 'selesai_pada' => now()->subHours(6), 'jumlah_revisi' => 1,
        ]);
        $this->tiketIsStatus(StatusPermintaan::Completed, [
            'created_at' => now()->subHours(20), 'selesai_pada' => now()->subHours(10), 'jumlah_revisi' => 0,
        ]);
        $this->tiketIsStatus(StatusPermintaan::Submitted, ['jumlah_revisi' => 2]); // tidak masuk durasi

        Sanctum::actingAs($this->supIs);
        $res = $this->getJson('/api/supervisor/dashboard')->assertOk();

        $res->assertJsonPath('data.rata_durasi_jam', 7)   // (4 jam + 10 jam) / 2
            ->assertJsonPath('data.rata_revisi', 1);      // (1 + 0 + 2) / 3

        $this->assertStringNotContainsStringIgnoringCase('sla', $res->getContent());
    }

    public function test_baru_hari_ini_hanya_menghitung_tiket_hari_ini(): void
    {
        $this->tiketIsStatus(StatusPermintaan::Submitted);
        $this->tiketIsStatus(StatusPermintaan::Submitted, ['created_at' => now()->subDays(3)]);

        Sanctum::actingAs($this->supIs);
        $this->getJson('/api/supervisor/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.baru_hari_ini', 1);
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->supIs->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->supIs->fresh());

        $this->getJson('/api/supervisor/dashboard')->assertForbidden();
    }

    public function test_supervisor_tanpa_section_melihat_data_kosong(): void
    {
        $tanpaSection = User::factory()->supervisor()->create(['id_bagian' => null]);
        $this->tiketIsStatus(StatusPermintaan::Submitted);

        Sanctum::actingAs($tanpaSection);
        $this->getJson('/api/supervisor/dashboard')
            ->assertOk()
            ->assertJsonPath('data.bagian', null)
            ->assertJsonPath('data.total', 0);
    }
}
