<?php

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/users — kelola pengguna (PRD 6.5). */
class PenggunaAdminTest extends TestCase
{
    use MembuatSkenarioTiket, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function sebagaiAdmin(): User
    {
        Sanctum::actingAs($this->admin);

        return $this->admin;
    }

    /** @return array<string, mixed> */
    private function dataBaru(array $timpa = []): array
    {
        return array_merge([
            'name' => 'Rina Wulandari',
            'nik' => 'TES-0999',
            'email' => 'rina@sbi.test',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'role' => 'employee',
            'id_bagian' => $this->bagianIs->id,
            'jabatan' => 'Staff',
            'telepon' => '+62 812 0000 9999',
        ], $timpa);
    }

    // ---- Hak akses ----------------------------------------------------

    public function test_tamu_ditolak_401(): void
    {
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_peran_selain_admin_ditolak_403(): void
    {
        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/users')->assertForbidden();
            $this->postJson('/api/admin/users', $this->dataBaru())->assertForbidden();
            $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['name' => 'X'])->assertForbidden();
        }
    }

    // ---- Daftar -------------------------------------------------------

    public function test_daftar_pengguna_berpaginasi_dan_tidak_membocorkan_password(): void
    {
        $this->sebagaiAdmin();

        $res = $this->getJson('/api/admin/users?per_page=5')->assertOk();

        $res->assertJsonCount(5, 'data')
            ->assertJsonStructure(['data' => [['id', 'name', 'nik', 'email', 'role', 'status', 'bagian']], 'meta' => ['total', 'per_page'], 'links'])
            ->assertJsonPath('meta.per_page', 5);
        $this->assertStringNotContainsString('password', $res->getContent());
    }

    public function test_daftar_bisa_difilter_dan_dicari(): void
    {
        $this->sebagaiAdmin();
        User::factory()->nonaktif()->employee($this->bagianGa)->create(['name' => 'Zainal Nonaktif']);

        $this->getJson('/api/admin/users?role=pic')->assertOk()
            ->assertJsonCount(3, 'data'); // picIs, picIs2, picGa

        $this->getJson('/api/admin/users?status=nonaktif')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Zainal Nonaktif');

        $this->getJson("/api/admin/users?id_bagian={$this->bagianIs->id}&role=supervisor")->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->supIs->id);

        $this->getJson('/api/admin/users?q=Zainal')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/users?role=bukan-peran')->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_detail_pengguna(): void
    {
        $this->sebagaiAdmin();

        $this->getJson("/api/admin/users/{$this->picIs->id}")->assertOk()
            ->assertJsonPath('data.role', 'pic')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS');

        $this->getJson('/api/admin/users/999999')->assertNotFound();
    }

    // ---- Buat ---------------------------------------------------------

    public function test_membuat_pengguna_dengan_peran_dan_section(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/users', $this->dataBaru(['role' => 'pic']))
            ->assertCreated()
            ->assertJsonPath('message', 'Pengguna berhasil dibuat.')
            ->assertJsonPath('data.role', 'pic')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS');

        $baru = User::where('email', 'rina@sbi.test')->firstOrFail();
        $this->assertTrue(Hash::check('Password123', $baru->password));
        $this->assertNotSame('Password123', $baru->password);
    }

    public function test_admin_baru_tidak_punya_section(): void
    {
        $this->sebagaiAdmin();

        $this->postJson('/api/admin/users', $this->dataBaru(['role' => 'admin', 'id_bagian' => null]))
            ->assertCreated()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonPath('data.bagian', null);

        $this->postJson('/api/admin/users', $this->dataBaru(['role' => 'admin', 'nik' => 'TES-0111', 'email' => 'adm2@sbi.test']))
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');
    }

    public function test_validasi_pembuatan_pengguna(): void
    {
        $this->sebagaiAdmin();
        $ada = User::factory()->employee($this->bagianIs)->create(['nik' => 'TES-0555', 'email' => 'ada@sbi.test']);

        $this->postJson('/api/admin/users', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'nik', 'email', 'password', 'role']);

        $this->postJson('/api/admin/users', $this->dataBaru(['nik' => $ada->nik, 'email' => $ada->email]))
            ->assertUnprocessable()->assertJsonValidationErrors(['nik', 'email']);

        // PIC/Supervisor/Karyawan wajib punya section aktif.
        $this->postJson('/api/admin/users', $this->dataBaru(['role' => 'pic', 'id_bagian' => null]))
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');

        $nonaktif = Bagian::factory()->nonaktif()->create();
        $this->postJson('/api/admin/users', $this->dataBaru(['id_bagian' => $nonaktif->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');

        $this->postJson('/api/admin/users', $this->dataBaru(['role' => 'superuser']))
            ->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->postJson('/api/admin/users', $this->dataBaru(['password' => 'pendek', 'password_confirmation' => 'pendek']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->postJson('/api/admin/users', $this->dataBaru(['password_confirmation' => 'Beda12345']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    // ---- Ubah ---------------------------------------------------------

    public function test_mengubah_data_tanpa_mengirim_semua_field(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['name' => 'Nama Baru', 'jabatan' => 'Lead'])
            ->assertOk()
            ->assertJsonPath('message', 'Pengguna berhasil diperbarui.')
            ->assertJsonPath('data.name', 'Nama Baru');

        $this->assertDatabaseHas('users', ['id' => $this->karyawan->id, 'name' => 'Nama Baru', 'jabatan' => 'Lead', 'email' => $this->karyawan->email]);
    }

    public function test_email_dan_nik_sendiri_tidak_dianggap_duplikat(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['email' => $this->karyawan->email, 'nik' => $this->karyawan->nik])
            ->assertOk();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['email' => $this->karyawanLain->email])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_admin_dapat_mereset_kata_sandi(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['password' => 'SandiBaru123', 'password_confirmation' => 'SandiBaru123'])
            ->assertOk();

        $this->assertTrue(Hash::check('SandiBaru123', $this->karyawan->fresh()->password));

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['password' => 'SandiBaru123'])
            ->assertUnprocessable()->assertJsonValidationErrors('password'); // tanpa konfirmasi
    }

    public function test_karyawan_dijadikan_pic_di_section_yang_dipilih(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['role' => 'pic', 'id_bagian' => $this->bagianIs->id])
            ->assertOk()
            ->assertJsonPath('data.role', 'pic')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS');
    }

    public function test_pic_tanpa_section_ditolak_dan_admin_otomatis_tanpa_section(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['id_bagian' => null])
            ->assertUnprocessable()->assertJsonValidationErrors('id_bagian');

        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonPath('data.bagian', null);
    }

    public function test_admin_tidak_dapat_menurunkan_atau_menonaktifkan_diri_sendiri(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->admin->id}", ['role' => 'employee', 'id_bagian' => $this->bagianIs->id])
            ->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->patchJson("/api/admin/users/{$this->admin->id}", ['status' => 'nonaktif'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');

        $this->assertSame(Role::Admin, $this->admin->fresh()->role);
        $this->assertSame(StatusAkun::Aktif, $this->admin->fresh()->status);
    }

    public function test_admin_dapat_menonaktifkan_admin_lain(): void
    {
        $this->sebagaiAdmin();
        $lain = User::factory()->admin()->create();

        $this->patchJson("/api/admin/users/{$lain->id}", ['status' => 'nonaktif'])->assertOk();

        $this->assertSame(StatusAkun::Nonaktif, $lain->fresh()->status);
    }

    // ---- Penonaktifan & integritas tiket ------------------------------

    public function test_akun_nonaktif_langsung_ditolak_di_semua_endpoint(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson("/api/admin/users/{$this->karyawan->id}", ['status' => 'nonaktif'])->assertOk()
            ->assertJsonPath('data.status', 'nonaktif');

        Sanctum::actingAs($this->karyawan->fresh());
        $this->getJson('/api/employee/ping')->assertForbidden();
    }

    public function test_akun_dapat_diaktifkan_kembali(): void
    {
        $this->sebagaiAdmin();
        $nonaktif = User::factory()->nonaktif()->employee($this->bagianIs)->create();

        $this->patchJson("/api/admin/users/{$nonaktif->id}", ['status' => 'aktif'])->assertOk()
            ->assertJsonPath('data.status', 'aktif');
    }

    public function test_pic_yang_masih_memegang_tiket_tidak_boleh_dilepas(): void
    {
        $this->sebagaiAdmin();
        Permintaan::factory()->dalamProses($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['status' => 'nonaktif'])
            ->assertConflict()
            ->assertJsonPath('message', fn (string $m) => str_contains($m, '1 tiket'));

        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['role' => 'employee'])->assertConflict();
        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['id_bagian' => $this->bagianGa->id])->assertConflict();

        $picIs = $this->picIs->fresh();
        $this->assertSame(Role::Pic, $picIs->role);
        $this->assertSame(StatusAkun::Aktif, $picIs->status);
        $this->assertSame($this->bagianIs->id, $picIs->id_bagian);

        // Mengubah data lain tetap boleh.
        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['telepon' => '+62 811 1111 2222'])->assertOk();
    }

    public function test_pic_dengan_tiket_selesai_boleh_dinonaktifkan(): void
    {
        $this->sebagaiAdmin();
        Permintaan::factory()->selesai($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        $this->patchJson("/api/admin/users/{$this->picIs->id}", ['status' => 'nonaktif'])->assertOk();

        $this->assertSame(StatusAkun::Nonaktif, $this->picIs->fresh()->status);
    }

    public function test_tidak_ada_endpoint_hapus(): void
    {
        $this->sebagaiAdmin();

        $this->deleteJson("/api/admin/users/{$this->karyawan->id}")->assertStatus(405);
        $this->assertDatabaseHas('users', ['id' => $this->karyawan->id]);
    }
}
