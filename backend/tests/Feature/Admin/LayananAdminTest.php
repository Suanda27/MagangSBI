<?php

namespace Tests\Feature\Admin;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Layanan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/layanan — kelola katalog layanan (PRD 6.5). */
class LayananAdminTest extends TestCase
{
    use MembuatSkenarioTiket, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function sebagaiAdmin(): void
    {
        Sanctum::actingAs($this->admin);
    }

    /** @return array<string, mixed> */
    private function dataBaru(array $timpa = []): array
    {
        return array_merge([
            'kode_layanan' => 'srv-101',
            'nama_layanan' => 'Perbaikan Printer',
            'kategori' => 'Dukungan IT',
            'deskripsi' => 'Printer rusak atau macet.',
            'id_bagian' => $this->bagianIs->id,
        ], $timpa);
    }

    public function test_hanya_admin_yang_boleh(): void
    {
        $this->getJson('/api/admin/layanan')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/layanan')->assertForbidden();
            $this->postJson('/api/admin/layanan', $this->dataBaru())->assertForbidden();
            $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['nama_layanan' => 'X'])->assertForbidden();
        }
    }

    public function test_daftar_menampilkan_semua_status_dan_bisa_difilter(): void
    {
        $this->sebagaiAdmin();
        $mati = Layanan::factory()->nonaktif()->create(['id_bagian' => $this->bagianIs->id, 'nama_layanan' => 'Layanan Lama', 'kategori' => 'Arsip']);

        $this->getJson('/api/admin/layanan')->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'kode_layanan', 'nama_layanan', 'kategori', 'status', 'bagian' => ['kode_bagian']]], 'meta', 'links']);

        $this->getJson('/api/admin/layanan?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mati->id);

        $this->getJson("/api/admin/layanan?id_bagian={$this->bagianGa->id}")->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $this->layananGa->id);

        $this->getJson('/api/admin/layanan?kategori=Arsip')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/layanan?q=Lama')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_layanan_nonaktif_tidak_muncul_di_referensi_pengajuan(): void
    {
        $this->sebagaiAdmin();
        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['status' => 'nonaktif'])->assertOk();

        Sanctum::actingAs($this->karyawan);
        $this->getJson("/api/referensi/layanan?bagian={$this->bagianIs->id}")->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_membuat_layanan_dengan_kode_huruf_besar(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/layanan', $this->dataBaru())
            ->assertCreated()
            ->assertJsonPath('data.kode_layanan', 'SRV-101')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS');

        $this->assertDatabaseHas('layanans', ['kode_layanan' => 'SRV-101', 'id_bagian' => $this->bagianIs->id]);
    }

    public function test_validasi_pembuatan_layanan(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/layanan', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['kode_layanan', 'nama_layanan', 'kategori', 'id_bagian']);

        $this->postJson('/api/admin/layanan', $this->dataBaru(['kode_layanan' => $this->layananIs->kode_layanan]))
            ->assertUnprocessable()->assertJsonValidationErrors('kode_layanan');

        $this->postJson('/api/admin/layanan', $this->dataBaru(['kode_layanan' => 'kode salah!']))
            ->assertUnprocessable()->assertJsonValidationErrors('kode_layanan');

        $nonaktif = Bagian::factory()->nonaktif()->create();
        $this->postJson('/api/admin/layanan', $this->dataBaru(['id_bagian' => $nonaktif->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');

        $this->postJson('/api/admin/layanan', $this->dataBaru(['id_bagian' => 999999]))
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    public function test_nama_layanan_unik_hanya_di_dalam_satu_section(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/layanan', $this->dataBaru(['nama_layanan' => $this->layananIs->nama_layanan]))
            ->assertUnprocessable()->assertJsonValidationErrors('nama_layanan');

        $this->postJson('/api/admin/layanan', $this->dataBaru(['nama_layanan' => $this->layananIs->nama_layanan, 'id_bagian' => $this->bagianGa->id]))
            ->assertCreated();
    }

    public function test_mengubah_layanan_sebagian_field(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['nama_layanan' => 'Nama Baru', 'kategori' => 'Kategori Baru'])
            ->assertOk()
            ->assertJsonPath('data.nama_layanan', 'Nama Baru')
            ->assertJsonPath('data.kode_layanan', $this->layananIs->kode_layanan);

        // Kode dan nama sendiri tidak dianggap duplikat; kode layanan lain ditolak.
        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['kode_layanan' => $this->layananIs->kode_layanan, 'nama_layanan' => 'Nama Baru'])->assertOk();
        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['kode_layanan' => $this->layananGa->kode_layanan])
            ->assertUnprocessable()->assertJsonValidationErrors('kode_layanan');
    }

    public function test_layanan_dapat_dipindah_ke_section_aktif_lain(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['id_bagian' => $this->bagianGa->id])
            ->assertOk()->assertJsonPath('data.bagian.kode_bagian', 'GA');

        $nonaktif = Bagian::factory()->nonaktif()->create();
        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['id_bagian' => $nonaktif->id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    public function test_layanan_dinonaktifkan_bukan_dihapus(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['status' => 'nonaktif'])->assertOk()
            ->assertJsonPath('data.status', 'nonaktif');
        $this->assertSame(StatusAkun::Nonaktif, $this->layananIs->fresh()->status);

        $this->patchJson("/api/admin/layanan/{$this->layananIs->id}", ['status' => 'aktif'])->assertOk();

        $this->deleteJson("/api/admin/layanan/{$this->layananIs->id}")->assertStatus(405);
        $this->assertDatabaseHas('layanans', ['id' => $this->layananIs->id]);
    }
}
