<?php

namespace Tests\Feature\Auth;

use App\Models\Bagian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** GET /api/auth/me. */
class MeTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_butuh_login(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_me_mengembalikan_data_akun_beserta_section(): void
    {
        $bagian = Bagian::factory()->create(['kode_bagian' => 'IS', 'nama_bagian' => 'Information System']);
        $user = User::factory()->employee($bagian)->create([
            'name' => 'Syifa Fitria', 'nik' => 'EMP-2023-0842', 'email' => 'syifa@sbi.co.id',
            'jabatan' => 'Staff', 'telepon' => '+62 812 0000 1111',
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Syifa Fitria')
            ->assertJsonPath('data.nik', 'EMP-2023-0842')
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonPath('data.role_label', 'Karyawan')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.home', '/employee/dashboard')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_admin_tanpa_section_mengembalikan_bagian_null(): void
    {
        Sanctum::actingAs(User::factory()->admin()->create());

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.bagian', null)
            ->assertJsonPath('data.home', '/admin/dashboard');
    }

    public function test_akun_nonaktif_ditolak_walau_sesi_masih_ada(): void
    {
        Sanctum::actingAs(User::factory()->nonaktif()->create());

        $this->getJson('/api/auth/me')
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan. Hubungi Administrator.');
    }
}
