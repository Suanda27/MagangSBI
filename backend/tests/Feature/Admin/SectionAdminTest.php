<?php

namespace Tests\Feature\Admin;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/sections — kelola section (PRD 6.5). */
class SectionAdminTest extends TestCase
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

    public function test_hanya_admin_yang_boleh(): void
    {
        $this->getJson('/api/admin/sections')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/sections')->assertForbidden();
            $this->postJson('/api/admin/sections', ['kode_bagian' => 'QA', 'nama_bagian' => 'Quality'])->assertForbidden();
            $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['nama_bagian' => 'X'])->assertForbidden();
        }
    }

    public function test_daftar_memuat_jumlah_pic_aktif_pengguna_dan_layanan(): void
    {
        $this->sebagaiAdmin();
        User::factory()->pic($this->bagianIs)->nonaktif()->create(); // PIC nonaktif tidak dihitung sebagai PIC aktif
        Layanan::factory()->create(['id_bagian' => $this->bagianIs->id]);

        $is = collect($this->getJson('/api/admin/sections')->assertOk()->json('data'))->firstWhere('kode_bagian', 'IS');

        $this->assertSame(2, $is['jumlah_pic']);        // picIs, picIs2
        $this->assertSame(4, $is['jumlah_pengguna']);   // 2 PIC aktif + 1 PIC nonaktif + 1 supervisor
        $this->assertSame(2, $is['jumlah_layanan']);    // satu dari skenario + satu baru
        $this->assertSame('aktif', $is['status']);
    }

    public function test_daftar_bisa_difilter(): void
    {
        $this->sebagaiAdmin();
        Bagian::factory()->nonaktif()->create(['kode_bagian' => 'OLD', 'nama_bagian' => 'Section Lama']);

        $this->getJson('/api/admin/sections?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.kode_bagian', 'OLD');

        $this->getJson('/api/admin/sections?q=ga')->assertOk()
            ->assertJsonPath('data.0.kode_bagian', 'GA');
    }

    public function test_membuat_section_dengan_kode_huruf_besar(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/sections', ['kode_bagian' => ' qa ', 'nama_bagian' => 'Quality Assurance', 'deskripsi' => 'Mutu produk'])
            ->assertCreated()
            ->assertJsonPath('data.kode_bagian', 'QA')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.jumlah_pic', 0);

        $this->assertDatabaseHas('bagians', ['kode_bagian' => 'QA', 'nama_bagian' => 'Quality Assurance']);
    }

    public function test_validasi_pembuatan_section(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/sections', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['kode_bagian', 'nama_bagian']);

        $this->postJson('/api/admin/sections', ['kode_bagian' => 'IS', 'nama_bagian' => $this->bagianIs->nama_bagian])
            ->assertUnprocessable()->assertJsonValidationErrors(['kode_bagian', 'nama_bagian']);

        foreach (['A', 'QA1', 'TERLALUPANJANG', 'Q A'] as $buruk) {
            $this->postJson('/api/admin/sections', ['kode_bagian' => $buruk, 'nama_bagian' => 'Nama '.$buruk])
                ->assertUnprocessable()->assertJsonValidationErrors('kode_bagian');
        }
    }

    public function test_mengubah_nama_dan_deskripsi(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['nama_bagian' => 'Information System', 'deskripsi' => 'Jaringan dan aplikasi'])
            ->assertOk()
            ->assertJsonPath('data.nama_bagian', 'Information System')
            ->assertJsonPath('data.kode_bagian', 'IS');

        // Nama sendiri tidak dianggap duplikat, nama section lain ditolak.
        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['nama_bagian' => 'Information System'])->assertOk();
        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['nama_bagian' => $this->bagianGa->nama_bagian])
            ->assertUnprocessable()->assertJsonValidationErrors('nama_bagian');
    }

    public function test_kode_section_tidak_dapat_diubah(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['kode_bagian' => 'XX'])
            ->assertUnprocessable()->assertJsonValidationErrors('kode_bagian');

        $this->assertSame('IS', $this->bagianIs->fresh()->kode_bagian);
    }

    public function test_section_tanpa_tiket_berjalan_boleh_dinonaktifkan_lalu_diaktifkan_lagi(): void
    {
        $this->sebagaiAdmin();
        Permintaan::factory()->selesai($this->picIs)->create(['id_layanan' => $this->layananIs->id, 'id_karyawan' => $this->karyawan->id]);

        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['status' => 'nonaktif'])->assertOk()
            ->assertJsonPath('data.status', 'nonaktif');
        $this->assertSame(StatusAkun::Nonaktif, $this->bagianIs->fresh()->status);

        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['status' => 'aktif'])->assertOk();
        $this->assertSame(StatusAkun::Aktif, $this->bagianIs->fresh()->status);
    }

    public function test_section_dengan_tiket_berjalan_tidak_boleh_dinonaktifkan(): void
    {
        $this->sebagaiAdmin();
        $this->tiketIs(); // tiket baru (submitted) ke section IS

        $this->patchJson("/api/admin/sections/{$this->bagianIs->id}", ['status' => 'nonaktif'])
            ->assertConflict()
            ->assertJsonPath('message', fn (string $m) => str_contains($m, '1 tiket'));

        $this->assertSame(StatusAkun::Aktif, $this->bagianIs->fresh()->status);
    }

    public function test_tidak_ada_endpoint_hapus(): void
    {
        $this->sebagaiAdmin();

        $this->deleteJson("/api/admin/sections/{$this->bagianIs->id}")->assertStatus(405);
        $this->assertDatabaseHas('bagians', ['id' => $this->bagianIs->id]);
    }
}
