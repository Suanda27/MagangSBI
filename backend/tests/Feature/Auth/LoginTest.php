<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Models\Bagian;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** POST /api/auth/login — Sanctum SPA (sesi cookie), PRD 6.1 dan D5. */
class LoginTest extends TestCase
{
    use RefreshDatabase;

    private const SANDI = 'Enterprise@2026';

    /** Permintaan dari frontend: Origin domain stateful Sanctum agar sesi aktif. */
    private function dariFrontend(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/login',
        ]);
    }

    private function akun(array $atribut = []): User
    {
        return User::factory()->create(array_merge([
            'nik' => 'EMP-2023-0842',
            'email' => 'syifa@sbi.co.id',
            'password' => self::SANDI,
        ], $atribut));
    }

    public function test_bisa_masuk_dengan_email(): void
    {
        $this->akun();

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertOk()
            ->assertJsonPath('data.email', 'syifa@sbi.co.id')
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonPath('message', 'Berhasil masuk.')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticated('web');
    }

    public function test_email_tidak_peka_huruf_besar_kecil(): void
    {
        $this->akun();

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'SYIFA@SBI.CO.ID', 'password' => self::SANDI])
            ->assertOk();
    }

    public function test_bisa_masuk_dengan_nik_huruf_kecil_maupun_besar(): void
    {
        $this->akun();

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'emp-2023-0842', 'password' => self::SANDI])
            ->assertOk()
            ->assertJsonPath('data.nik', 'EMP-2023-0842');
    }

    public function test_opsi_ingat_saya_membuat_cookie_remember(): void
    {
        $this->akun();

        $res = $this->dariFrontend()->postJson('/api/auth/login', [
            'login' => 'syifa@sbi.co.id', 'password' => self::SANDI, 'remember' => true,
        ])->assertOk();

        $ada = collect($res->headers->getCookies())->contains(fn ($c) => str_starts_with($c->getName(), 'remember_web_'));
        $this->assertTrue($ada, 'Cookie remember_web_* tidak terkirim');
    }

    public function test_tanpa_ingat_saya_tidak_ada_cookie_remember(): void
    {
        $this->akun();

        $res = $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertOk();

        $ada = collect($res->headers->getCookies())->contains(fn ($c) => str_starts_with($c->getName(), 'remember_web_'));
        $this->assertFalse($ada);
    }

    public function test_sandi_salah_dan_akun_tidak_ada_memberi_pesan_yang_sama(): void
    {
        $this->akun();

        $salah = $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-total'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.login.0', 'NIK/Email atau kata sandi tidak valid.');

        $tidakAda = $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'tidak.ada@sbi.co.id', 'password' => self::SANDI])
            ->assertUnprocessable()
            ->assertJsonPath('errors.login.0', 'NIK/Email atau kata sandi tidak valid.');

        $this->assertSame($salah->json('errors'), $tidakAda->json('errors'));
        $this->assertGuest('web');
    }

    public function test_field_wajib_divalidasi(): void
    {
        $this->dariFrontend()->postJson('/api/auth/login', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['login', 'password']);
    }

    public function test_akun_nonaktif_ditolak_dengan_pesan_jelas_dan_tanpa_sesi(): void
    {
        $this->akun(['status' => 'nonaktif']);

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan. Hubungi Administrator.');

        $this->assertGuest('web');
    }

    public function test_akun_nonaktif_dengan_sandi_salah_tidak_membocorkan_status(): void
    {
        $this->akun(['status' => 'nonaktif']);

        // Sandi salah -> pesan umum, bukan "dinonaktifkan" (akun tidak bisa ditebak).
        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-total'])
            ->assertUnprocessable()
            ->assertJsonPath('errors.login.0', 'NIK/Email atau kata sandi tidak valid.');
    }

    public function test_percobaan_keenam_dalam_semenit_diblokir_dengan_retry_after(): void
    {
        $this->akun();

        for ($i = 0; $i < 5; $i++) {
            $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-'.$i])
                ->assertUnprocessable();
        }

        $res = $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertStatus(429);

        $this->assertNotEmpty($res->headers->get('Retry-After'));
        $this->assertStringContainsString('Terlalu banyak percobaan masuk', $res->json('message'));
        $this->assertGuest('web'); // bahkan sandi benar tetap diblokir selama terkunci
    }

    public function test_login_berhasil_mereset_hitungan_percobaan(): void
    {
        $this->akun();

        for ($i = 0; $i < 4; $i++) {
            $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-'.$i])
                ->assertUnprocessable();
        }

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])->assertOk();
        $this->app['auth']->forgetGuards();

        // Empat kegagalan baru tidak boleh langsung terkunci (hitungan sudah di-reset).
        for ($i = 0; $i < 4; $i++) {
            $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-lagi-'.$i])
                ->assertUnprocessable();
        }
    }

    public function test_pembatas_dihitung_per_akun_bukan_global(): void
    {
        $this->akun();
        $this->akun(['nik' => 'EMP-2023-0001', 'email' => 'lain@sbi.co.id']);

        for ($i = 0; $i < 5; $i++) {
            $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'salah-'.$i])
                ->assertUnprocessable();
        }

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'lain@sbi.co.id', 'password' => self::SANDI])
            ->assertOk();
    }

    /** @return array<string, array{Role, string}> */
    public static function jalurDashboard(): array
    {
        return [
            'karyawan' => [Role::Employee, '/employee/dashboard'],
            'supervisor' => [Role::Supervisor, '/supervisor/dashboard'],
            'pic' => [Role::Pic, '/pic/dashboard'],
            'admin' => [Role::Admin, '/admin/dashboard'],
        ];
    }

    #[DataProvider('jalurDashboard')]
    public function test_respons_memuat_jalur_dashboard_sesuai_peran(Role $peran, string $jalur): void
    {
        $bagian = Bagian::factory()->create();
        $this->akun([
            'role' => $peran,
            'id_bagian' => $peran === Role::Admin ? null : $bagian->id,
        ]);

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertOk()
            ->assertJsonPath('data.role', $peran->value)
            ->assertJsonPath('data.home', $jalur);
    }

    public function test_permintaan_tanpa_sesi_frontend_ditolak_jelas(): void
    {
        $this->akun();

        // Tanpa Origin/Referer frontend (mis. curl), sesi tidak aktif -> jangan pura-pura berhasil.
        $this->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => self::SANDI])
            ->assertStatus(400)
            ->assertJsonPath('message', 'Permintaan login harus berasal dari aplikasi frontend (domain stateful).');
    }

    public function test_endpoint_csrf_cookie_sanctum_mengirim_cookie_xsrf(): void
    {
        $res = $this->dariFrontend()->get('/sanctum/csrf-cookie')->assertNoContent();

        $this->assertTrue(
            collect($res->headers->getCookies())->contains(fn ($c) => $c->getName() === 'XSRF-TOKEN'),
            'Cookie XSRF-TOKEN tidak dikirim',
        );
    }
}
