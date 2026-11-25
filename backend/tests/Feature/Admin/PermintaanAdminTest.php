<?php

namespace Tests\Feature\Admin;

use App\Enums\StatusPermintaan;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\Plant;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/admin/dashboard, /api/admin/permintaan, dan /api/admin/permintaan/{id}. */
class PermintaanAdminTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], bool $untukGa = false): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => ($untukGa ? $this->layananGa : $this->layananIs)->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    /** @return list<string> */
    private function kode(string $url): array
    {
        return collect($this->getJson($url)->assertOk()->json('data'))->pluck('kode_tiket')->all();
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_hanya_admin_yang_boleh(): void
    {
        $tiket = $this->tiket();
        $urls = ['/api/admin/dashboard', '/api/admin/permintaan', '/api/admin/permintaan/'.$tiket->id];

        foreach ($urls as $url) {
            $this->getJson($url)->assertUnauthorized();
        }

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $akun) {
            Sanctum::actingAs($akun);
            foreach ($urls as $url) {
                $this->getJson($url)->assertForbidden();
            }
        }
    }

    // ---- Daftar --------------------------------------------------------

    public function test_admin_melihat_tiket_semua_section_dengan_ringkasan_seluruh_sistem(): void
    {
        $a = $this->tiket(StatusPermintaan::Submitted);
        $b = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id], untukGa: true);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/admin/permintaan')->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('ringkasan.total', 3)
            ->assertJsonPath('ringkasan.per_status.submitted', 1)
            ->assertJsonPath('ringkasan.per_status.in_progress', 1)
            ->assertJsonPath('ringkasan.per_status.completed', 1)
            ->assertJsonPath('ringkasan.per_status.rejected', 0);

        $kode = collect($res->json('data'))->pluck('kode_tiket');
        $this->assertTrue($kode->contains($a->kode_tiket) && $kode->contains($b->kode_tiket));
        $this->assertSame($this->karyawan->name, $res->json('data.0.pengaju.name'));
    }

    public function test_daftar_menyertakan_pic_penanggung_jawab_bila_ada(): void
    {
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Submitted);
        Sanctum::actingAs($this->admin);

        $data = collect($this->getJson('/api/admin/permintaan')->assertOk()->json('data'));

        $this->assertSame($this->picIs->name, $data->firstWhere('status', 'in_progress')['pic']['name']);
        $this->assertNull($data->firstWhere('status', 'submitted')['pic']);
    }

    public function test_filter_status_section_plant_dan_kata_kunci(): void
    {
        $plant2 = Plant::factory()->create();
        $selesaiIs = $this->tiket(StatusPermintaan::Completed, ['judul' => 'Printer rusak']);
        $baruGa = $this->tiket(StatusPermintaan::Submitted, ['id_plant' => $plant2->id], untukGa: true);
        $this->tiket(StatusPermintaan::Rejected);

        Sanctum::actingAs($this->admin);

        $this->assertSame([$selesaiIs->kode_tiket], $this->kode('/api/admin/permintaan?status=completed'));
        $this->assertSame(2, count($this->kode('/api/admin/permintaan?status=completed,rejected')));
        $this->assertSame([$baruGa->kode_tiket], $this->kode('/api/admin/permintaan?id_bagian='.$this->bagianGa->id));
        $this->assertSame([$baruGa->kode_tiket], $this->kode('/api/admin/permintaan?id_plant='.$plant2->id));
        $this->assertSame([$selesaiIs->kode_tiket], $this->kode('/api/admin/permintaan?q=printer'));
        $this->assertSame([$baruGa->kode_tiket], $this->kode('/api/admin/permintaan?q='.urlencode($baruGa->kode_tiket)));
    }

    public function test_pencarian_menjangkau_nama_dan_nik_pengaju_serta_aman_dari_karakter_like(): void
    {
        $this->tiket();
        Sanctum::actingAs($this->admin);

        $this->assertCount(1, $this->kode('/api/admin/permintaan?q='.urlencode($this->karyawan->name)));
        $this->assertCount(1, $this->kode('/api/admin/permintaan?q='.urlencode((string) $this->karyawan->nik)));
        // "%" harfiah tidak boleh menjadi pola yang cocok dengan semua baris.
        $this->assertSame([], $this->kode('/api/admin/permintaan?q='.urlencode('%')));
    }

    public function test_paginasi_dan_parameter_tidak_valid_422(): void
    {
        foreach (range(1, 3) as $i) {
            $this->tiket();
        }
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/permintaan?per_page=2')->assertOk()
            ->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 3);

        $this->getJson('/api/admin/permintaan?status=ngawur')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->getJson('/api/admin/permintaan?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/admin/permintaan?id_bagian=abc')->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    // ---- Detail --------------------------------------------------------

    public function test_admin_membuka_detail_tiket_section_mana_pun(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id], untukGa: true);
        RiwayatPermintaan::create(['id_permintaan' => $tiket->id, 'id_user' => $this->karyawan->id, 'status' => StatusPermintaan::Submitted, 'aksi' => 'submitted']);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/permintaan/'.$tiket->id)->assertOk()
            ->assertJsonPath('data.id', $tiket->id)
            ->assertJsonPath('data.status_label', 'Sedang Diproses')
            ->assertJsonPath('data.pengaju.name', $this->karyawan->name)
            ->assertJsonPath('data.pic.name', $this->picIs->name)
            ->assertJsonCount(1, 'data.riwayat')
            ->assertJsonMissingPath('data.bisa_ditinjau');

        $this->getJson('/api/admin/permintaan/999999')->assertNotFound();
    }

    public function test_admin_tidak_punya_rute_untuk_mengubah_tiket(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/permintaan/'.$tiket->id.'/terima')->assertStatus(404);
        $this->postJson('/api/pic/permintaan/'.$tiket->id.'/terima')->assertForbidden();
        $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
    }

    // ---- Dashboard -----------------------------------------------------

    public function test_dashboard_menghitung_master_data_tiket_dan_beban_section(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);

        $sectionNonaktif = Bagian::factory()->nonaktif()->create();
        Layanan::factory()->nonaktif()->create(['id_bagian' => $sectionNonaktif->id]);

        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/admin/dashboard')->assertOk()
            ->assertJsonPath('data.tiket.total', 3)
            ->assertJsonPath('data.tiket.per_status.submitted', 2)
            ->assertJsonPath('data.tiket.per_status.completed', 1)
            ->assertJsonPath('data.section.nonaktif', 1)
            ->assertJsonPath('data.layanan.nonaktif', 1)
            ->assertJsonPath('data.pic.total', 3)
            ->assertJsonPath('data.pic.aktif', 3)
            ->assertJsonCount(3, 'data.tiket_terbaru');

        $this->assertSame(Bagian::count(), $res->json('data.section.total'));
        $this->assertSame(User::count(), $res->json('data.pengguna.total'));

        $beban = collect($res->json('data.beban_section'));
        $this->assertSame(2, $beban->firstWhere('kode_bagian', 'IS')['jumlah']);
        $this->assertSame(1, $beban->firstWhere('kode_bagian', 'GA')['jumlah']);
        $this->assertSame('IS', $beban->first()['kode_bagian']); // beban terbanyak di atas
    }

    public function test_dashboard_membatasi_tiket_terbaru_lima(): void
    {
        foreach (range(1, 7) as $i) {
            $this->tiket();
        }
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/dashboard')->assertOk()
            ->assertJsonCount(5, 'data.tiket_terbaru')
            ->assertJsonPath('data.tiket.total', 7);
    }
}
