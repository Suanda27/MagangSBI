<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** PATCH /api/auth/me — ubah nama, email, telepon (PRD 6.1). */
class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private function masuk(array $atribut = []): User
    {
        $user = User::factory()->employee(Bagian::factory()->create())->create(array_merge([
            'name' => 'Syifa Lama', 'nik' => 'EMP-2023-0842', 'email' => 'syifa@sbi.co.id', 'telepon' => '+62 812 0000 1111',
        ], $atribut));
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_bisa_mengubah_nama_email_dan_telepon(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/me', [
            'name' => 'Syifa Fitria Azizah', 'email' => 'syifa.baru@sbi.co.id', 'telepon' => '+62 813 5555 7777',
        ])->assertOk()
            ->assertJsonPath('message', 'Profil berhasil diperbarui.')
            ->assertJsonPath('data.name', 'Syifa Fitria Azizah')
            ->assertJsonPath('data.email', 'syifa.baru@sbi.co.id')
            ->assertJsonPath('data.telepon', '+62 813 5555 7777');

        $this->assertDatabaseHas('users', [
            'id' => $user->id, 'name' => 'Syifa Fitria Azizah', 'email' => 'syifa.baru@sbi.co.id',
        ]);
    }

    public function test_boleh_mengubah_sebagian_field_saja(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/me', ['telepon' => '0812-3456-7890'])->assertOk();

        $user->refresh();
        $this->assertSame('0812-3456-7890', $user->telepon);
        $this->assertSame('Syifa Lama', $user->name);          // tidak ikut berubah
        $this->assertSame('syifa@sbi.co.id', $user->email);
    }

    public function test_telepon_boleh_dikosongkan(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/me', ['telepon' => '  '])->assertOk()->assertJsonPath('data.telepon', null);
        $this->assertNull($user->refresh()->telepon);
    }

    public function test_email_dinormalisasi_huruf_kecil(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/me', ['email' => 'Syifa.Baru@SBI.co.id'])
            ->assertOk()
            ->assertJsonPath('data.email', 'syifa.baru@sbi.co.id');
    }

    public function test_email_milik_orang_lain_ditolak_tetapi_email_sendiri_boleh(): void
    {
        User::factory()->create(['email' => 'lain@sbi.co.id']);
        $this->masuk();

        $this->patchJson('/api/auth/me', ['email' => 'lain@sbi.co.id'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', 'Email ini sudah digunakan.');

        // Mengirim email sendiri tidak dianggap duplikat.
        $this->patchJson('/api/auth/me', ['email' => 'syifa@sbi.co.id', 'name' => 'Nama Baru'])->assertOk();
    }

    public function test_nik_role_status_dan_section_tidak_bisa_diubah_lewat_endpoint_ini(): void
    {
        $user = $this->masuk();
        $bagianAsal = $user->id_bagian;
        $bagianLain = Bagian::factory()->create();

        $this->patchJson('/api/auth/me', [
            'name' => 'Nama Baru',
            'nik' => 'HACK-0001',
            'role' => 'admin',
            'status' => 'nonaktif',
            'id_bagian' => $bagianLain->id,
        ])->assertOk();

        $user->refresh();
        $this->assertSame('Nama Baru', $user->name);                 // yang sah berubah
        $this->assertSame('EMP-2023-0842', $user->nik);              // sisanya diabaikan
        $this->assertSame(Role::Employee, $user->role);
        $this->assertSame(StatusAkun::Aktif, $user->status);
        $this->assertSame($bagianAsal, $user->id_bagian);
    }

    public function test_validasi_nama_email_dan_telepon(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/me', ['name' => '', 'email' => 'bukan-email', 'telepon' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'telepon']);
    }

    public function test_email_baru_mengikuti_pembatasan_domain_perusahaan(): void
    {
        config(['register.allowed_email_domains' => ['sbi.co.id']]);
        $this->masuk();

        // Pembatasan registrasi tidak boleh bisa dilewati lewat ubah profil.
        $this->patchJson('/api/auth/me', ['email' => 'saya@gmail.com'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->patchJson('/api/auth/me', ['email' => 'saya@sbi.co.id'])->assertOk();
    }

    public function test_butuh_login_dan_akun_aktif(): void
    {
        $this->patchJson('/api/auth/me', ['name' => 'X'])->assertUnauthorized();

        Sanctum::actingAs(User::factory()->nonaktif()->create());
        $this->patchJson('/api/auth/me', ['name' => 'X'])->assertForbidden();
    }
}
