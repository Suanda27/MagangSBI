<?php

namespace Tests\Feature\Admin;

use App\Enums\StatusAkun;
use App\Models\Lantai;
use App\Models\Plant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/plants dan /api/admin/lantais — master lokasi (PRD 6.5). */
class LokasiAdminTest extends TestCase
{
    use MembuatSkenarioTiket, RefreshDatabase;

    private Plant $plant1;

    private Plant $plant2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();

        $this->plant1 = Plant::factory()->create(['nama_plant' => 'Plant 1']);
        $this->plant2 = Plant::factory()->create(['nama_plant' => 'Plant 2']);
        Lantai::factory()->create(['id_plant' => $this->plant1->id, 'nama_lantai' => 'Lantai 1']);
        Lantai::factory()->create(['id_plant' => $this->plant1->id, 'nama_lantai' => 'Lantai 2']);
    }

    private function sebagaiAdmin(): void
    {
        Sanctum::actingAs($this->admin);
    }

    // ---- Hak akses ----------------------------------------------------

    public function test_hanya_admin_yang_boleh(): void
    {
        $this->getJson('/api/admin/plants')->assertUnauthorized();
        $this->getJson('/api/admin/lantais')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/plants')->assertForbidden();
            $this->postJson('/api/admin/plants', ['nama_plant' => 'X'])->assertForbidden();
            $this->patchJson("/api/admin/plants/{$this->plant1->id}", ['nama_plant' => 'X'])->assertForbidden();
            $this->getJson('/api/admin/lantais')->assertForbidden();
            $this->postJson('/api/admin/lantais', ['id_plant' => $this->plant1->id, 'nama_lantai' => 'X'])->assertForbidden();
        }
    }

    // ---- Plant --------------------------------------------------------

    public function test_daftar_plant_memuat_lantai_dan_jumlahnya(): void
    {
        $this->sebagaiAdmin();
        Lantai::factory()->nonaktif()->create(['id_plant' => $this->plant1->id, 'nama_lantai' => 'Lantai 9']);

        $res = $this->getJson('/api/admin/plants')->assertOk();

        $p1 = collect($res->json('data'))->firstWhere('nama_plant', 'Plant 1');
        $this->assertSame(3, $p1['jumlah_lantai']);
        $this->assertSame(['Lantai 1', 'Lantai 2', 'Lantai 9'], array_column($p1['lantais'], 'nama_lantai')); // semua status
        $p2 = collect($res->json('data'))->firstWhere('nama_plant', 'Plant 2');
        $this->assertSame(0, $p2['jumlah_lantai']);
    }

    public function test_daftar_plant_bisa_difilter(): void
    {
        $this->sebagaiAdmin();
        Plant::factory()->nonaktif()->create(['nama_plant' => 'Plant Lama']);

        $this->getJson('/api/admin/plants?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.nama_plant', 'Plant Lama');
        $this->getJson('/api/admin/plants?q=Plant 2')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $this->plant2->id);
    }

    public function test_membuat_plant(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/plants', ['nama_plant' => '  Plant 3  '])
            ->assertCreated()
            ->assertJsonPath('data.nama_plant', 'Plant 3')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.jumlah_lantai', 0);

        $this->postJson('/api/admin/plants', ['nama_plant' => 'Plant 3'])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_plant');
        $this->postJson('/api/admin/plants', [])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_plant');
    }

    public function test_mengubah_dan_menonaktifkan_plant(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/plants/{$this->plant2->id}", ['nama_plant' => 'Plant Dua'])
            ->assertOk()->assertJsonPath('data.nama_plant', 'Plant Dua');

        // Nama sendiri tidak dianggap duplikat; nama plant lain ditolak.
        $this->patchJson("/api/admin/plants/{$this->plant2->id}", ['nama_plant' => 'Plant Dua'])->assertOk();
        $this->patchJson("/api/admin/plants/{$this->plant2->id}", ['nama_plant' => 'Plant 1'])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_plant');

        $this->patchJson("/api/admin/plants/{$this->plant2->id}", ['status' => 'nonaktif'])->assertOk()
            ->assertJsonPath('data.status', 'nonaktif');
        $this->assertSame(StatusAkun::Nonaktif, $this->plant2->fresh()->status);

        $this->deleteJson("/api/admin/plants/{$this->plant2->id}")->assertStatus(405);
    }

    // ---- Lantai -------------------------------------------------------

    public function test_daftar_lantai_bisa_difilter(): void
    {
        $this->sebagaiAdmin();
        Lantai::factory()->create(['id_plant' => $this->plant2->id, 'nama_lantai' => 'Lantai 1']);

        $this->getJson('/api/admin/lantais')->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'nama_lantai', 'id_plant', 'status', 'plant' => ['id', 'nama_plant']]]]);

        $this->getJson("/api/admin/lantais?id_plant={$this->plant1->id}")->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/lantais?status=nonaktif')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_membuat_lantai(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/lantais', ['id_plant' => $this->plant2->id, 'nama_lantai' => 'Lantai 1'])
            ->assertCreated()
            ->assertJsonPath('data.plant.nama_plant', 'Plant 2')
            ->assertJsonPath('data.status', 'aktif');

        // Nama sama di plant berbeda boleh (sudah di atas), di plant yang sama ditolak.
        $this->postJson('/api/admin/lantais', ['id_plant' => $this->plant1->id, 'nama_lantai' => 'Lantai 1'])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_lantai');
    }

    public function test_validasi_pembuatan_lantai(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/lantais', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['id_plant', 'nama_lantai']);

        $nonaktif = Plant::factory()->nonaktif()->create();
        $this->postJson('/api/admin/lantais', ['id_plant' => $nonaktif->id, 'nama_lantai' => 'Lantai 1'])
            ->assertUnprocessable()->assertJsonValidationErrors('id_plant');
    }

    public function test_mengubah_dan_menonaktifkan_lantai_tetapi_tidak_dapat_dipindah_plant(): void
    {
        $this->sebagaiAdmin();
        $lantai = Lantai::where('nama_lantai', 'Lantai 2')->firstOrFail();

        $this->patchJson("/api/admin/lantais/{$lantai->id}", ['nama_lantai' => 'Lantai Dua'])
            ->assertOk()->assertJsonPath('data.nama_lantai', 'Lantai Dua');
        $this->patchJson("/api/admin/lantais/{$lantai->id}", ['nama_lantai' => 'Lantai 1'])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_lantai');

        $this->patchJson("/api/admin/lantais/{$lantai->id}", ['status' => 'nonaktif'])->assertOk()
            ->assertJsonPath('data.status', 'nonaktif');

        $this->patchJson("/api/admin/lantais/{$lantai->id}", ['id_plant' => $this->plant2->id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_plant');
        $this->assertSame($this->plant1->id, $lantai->fresh()->id_plant);

        $this->deleteJson("/api/admin/lantais/{$lantai->id}")->assertStatus(405);
    }

    // ---- Dampak ke form pengajuan -------------------------------------

    public function test_lokasi_nonaktif_tidak_muncul_di_referensi_form_pengajuan(): void
    {
        $this->sebagaiAdmin();
        $lantai2 = Lantai::where('nama_lantai', 'Lantai 2')->firstOrFail();
        $this->patchJson("/api/admin/lantais/{$lantai2->id}", ['status' => 'nonaktif'])->assertOk();
        $this->patchJson("/api/admin/plants/{$this->plant2->id}", ['status' => 'nonaktif'])->assertOk();

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/referensi/lokasi')->assertOk();

        $plants = collect($res->json('data'));
        $this->assertNull($plants->firstWhere('nama_plant', 'Plant 2'));
        $this->assertSame(['Lantai 1'], array_column($plants->firstWhere('nama_plant', 'Plant 1')['lantais'], 'nama_lantai'));
    }
}
