<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/pic-mapping — pemetaan PIC ke section (PRD D4, 6.5). */
class PicMappingAdminTest extends TestCase
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
        $this->getJson('/api/admin/pic-mapping')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/pic-mapping')->assertForbidden();
            $this->postJson('/api/admin/pic-mapping', ['user_id' => $this->karyawan->id, 'id_bagian' => $this->bagianIs->id])->assertForbidden();
            $this->patchJson("/api/admin/pic-mapping/{$this->picIs->id}", ['id_bagian' => $this->bagianGa->id])->assertForbidden();
            $this->deleteJson("/api/admin/pic-mapping/{$this->picIs->id}")->assertForbidden();
        }
    }

    public function test_daftar_hanya_berisi_pic_beserta_section_dan_beban_tiket(): void
    {
        $this->sebagaiAdmin();
        Permintaan::factory()->dalamProses($this->picIs)->create(['id_layanan' => $this->layananIs->id, 'id_karyawan' => $this->karyawan->id]);
        Permintaan::factory()->selesai($this->picIs)->create(['id_layanan' => $this->layananIs->id, 'id_karyawan' => $this->karyawan->id]);

        $res = $this->getJson('/api/admin/pic-mapping')->assertOk()
            ->assertJsonCount(3, 'data') // picIs, picIs2, picGa — tanpa karyawan/supervisor/admin
            ->assertJsonStructure(['data' => [['id', 'name', 'nik', 'email', 'status', 'bagian' => ['kode_bagian'], 'tiket_aktif']], 'meta', 'links']);

        $this->assertSame(['pic'], array_values(array_unique(array_column($res->json('data'), 'role'))));
        $this->assertSame(1, collect($res->json('data'))->firstWhere('id', $this->picIs->id)['tiket_aktif']); // yang selesai tidak dihitung
        $this->assertSame(0, collect($res->json('data'))->firstWhere('id', $this->picIs2->id)['tiket_aktif']);
    }

    public function test_daftar_bisa_difilter(): void
    {
        $this->sebagaiAdmin();
        User::factory()->pic($this->bagianGa)->nonaktif()->create(['name' => 'Pic Nonaktif']);

        $this->getJson("/api/admin/pic-mapping?id_bagian={$this->bagianIs->id}")->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/pic-mapping?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Pic Nonaktif');
        $this->getJson('/api/admin/pic-mapping?q=Pic Nonaktif')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_menetapkan_karyawan_sebagai_pic(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/pic-mapping', ['user_id' => $this->karyawan->id, 'id_bagian' => $this->bagianIs->id])
            ->assertCreated()
            ->assertJsonPath('message', 'PIC berhasil ditetapkan.')
            ->assertJsonPath('data.role', 'pic')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS')
            ->assertJsonPath('data.tiket_aktif', 0);

        $this->assertSame(Role::Pic, $this->karyawan->fresh()->role);
        $this->assertSame($this->bagianIs->id, $this->karyawan->fresh()->id_bagian);
    }

    public function test_satu_section_boleh_banyak_pic(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/pic-mapping', ['user_id' => $this->karyawan->id, 'id_bagian' => $this->bagianIs->id])->assertCreated();
        $this->postJson('/api/admin/pic-mapping', ['user_id' => $this->karyawanLain->id, 'id_bagian' => $this->bagianIs->id])->assertCreated();

        $this->getJson("/api/admin/pic-mapping?id_bagian={$this->bagianIs->id}")->assertOk()->assertJsonCount(4, 'data');
    }

    public function test_validasi_penetapan_pic(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/pic-mapping', [])->assertUnprocessable()->assertJsonValidationErrors(['user_id', 'id_bagian']);

        // Sudah PIC → ubah section lewat PATCH. Supervisor/admin tidak boleh langsung dijadikan PIC.
        foreach ([$this->picIs, $this->supIs, $this->admin] as $bukanKaryawan) {
            $this->postJson('/api/admin/pic-mapping', ['user_id' => $bukanKaryawan->id, 'id_bagian' => $this->bagianGa->id])
                ->assertUnprocessable()->assertJsonValidationErrors('user_id');
        }

        $nonaktif = User::factory()->nonaktif()->employee($this->bagianIs)->create();
        $this->postJson('/api/admin/pic-mapping', ['user_id' => $nonaktif->id, 'id_bagian' => $this->bagianIs->id])
            ->assertUnprocessable()->assertJsonValidationErrors('user_id');

        $this->postJson('/api/admin/pic-mapping', ['user_id' => 999999, 'id_bagian' => $this->bagianIs->id])
            ->assertUnprocessable()->assertJsonValidationErrors('user_id');

        $bagianMati = Bagian::factory()->nonaktif()->create();
        $this->postJson('/api/admin/pic-mapping', ['user_id' => $this->karyawan->id, 'id_bagian' => $bagianMati->id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    public function test_memindahkan_pic_ke_section_lain(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/pic-mapping/{$this->picIs->id}", ['id_bagian' => $this->bagianGa->id])
            ->assertOk()->assertJsonPath('data.bagian.kode_bagian', 'GA');

        $this->assertSame($this->bagianGa->id, $this->picIs->fresh()->id_bagian);

        // Section yang sama bukan kesalahan.
        $this->patchJson("/api/admin/pic-mapping/{$this->picIs->id}", ['id_bagian' => $this->bagianGa->id])->assertOk();
        $this->patchJson("/api/admin/pic-mapping/{$this->picIs->id}", [])->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    public function test_hanya_pic_yang_dapat_dipindah_atau_dikembalikan(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/pic-mapping/{$this->karyawan->id}", ['id_bagian' => $this->bagianIs->id])->assertNotFound();
        $this->deleteJson("/api/admin/pic-mapping/{$this->karyawan->id}")->assertNotFound();
        $this->assertSame(Role::Employee, $this->karyawan->fresh()->role);
    }

    public function test_mengembalikan_pic_menjadi_karyawan_tanpa_menghapus_akun(): void
    {
        $this->sebagaiAdmin();

        $this->deleteJson("/api/admin/pic-mapping/{$this->picIs->id}")
            ->assertOk()
            ->assertJsonPath('message', 'PIC dikembalikan menjadi karyawan.')
            ->assertJsonPath('data.role', 'employee');

        $kembali = $this->picIs->fresh();
        $this->assertSame(Role::Employee, $kembali->role);
        $this->assertSame($this->bagianIs->id, $kembali->id_bagian); // section tetap
        $this->assertSame(StatusAkun::Aktif, $kembali->status);
    }

    public function test_pic_yang_masih_memegang_tiket_tidak_boleh_dipindah_atau_dikembalikan(): void
    {
        $this->sebagaiAdmin();
        Permintaan::factory()->dalamProses($this->picIs)->create(['id_layanan' => $this->layananIs->id, 'id_karyawan' => $this->karyawan->id]);

        $this->patchJson("/api/admin/pic-mapping/{$this->picIs->id}", ['id_bagian' => $this->bagianGa->id])
            ->assertConflict()
            ->assertJsonPath('message', fn (string $m) => str_contains($m, '1 tiket'));
        $this->deleteJson("/api/admin/pic-mapping/{$this->picIs->id}")->assertConflict();

        $pic = $this->picIs->fresh();
        $this->assertSame(Role::Pic, $pic->role);
        $this->assertSame($this->bagianIs->id, $pic->id_bagian);
    }
}
