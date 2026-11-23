<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** PATCH /api/auth/password. */
class PasswordTest extends TestCase
{
    use RefreshDatabase;

    private const LAMA = 'SandiLama@2026';

    private function masuk(): User
    {
        $user = User::factory()->create([
            'email' => 'syifa@sbi.co.id', 'password' => self::LAMA, 'remember_token' => 'token-lama',
        ]);
        Sanctum::actingAs($user);

        return $user;
    }

    /** @return array<string, string> */
    private function data(array $override = []): array
    {
        return array_merge([
            'current_password' => self::LAMA,
            'password' => 'SandiBaru@2027',
            'password_confirmation' => 'SandiBaru@2027',
        ], $override);
    }

    public function test_bisa_mengganti_kata_sandi(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/password', $this->data())
            ->assertOk()
            ->assertJsonPath('message', 'Kata sandi berhasil diubah.');

        $user->refresh();
        $this->assertTrue(Hash::check('SandiBaru@2027', $user->password));
        $this->assertFalse(Hash::check(self::LAMA, $user->password));
    }

    public function test_token_ingat_saya_diputar_agar_perangkat_lain_keluar(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/password', $this->data())->assertOk();

        $this->assertNotSame('token-lama', $user->refresh()->remember_token);
    }

    public function test_sandi_lama_salah_ditolak_dan_sandi_tidak_berubah(): void
    {
        $user = $this->masuk();

        $this->patchJson('/api/auth/password', $this->data(['current_password' => 'bukan-sandi-lama']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.current_password.0', 'Kata sandi saat ini salah.');

        $this->assertTrue(Hash::check(self::LAMA, $user->refresh()->password));
    }

    public function test_konfirmasi_harus_cocok(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/password', $this->data(['password_confirmation' => 'beda']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'Konfirmasi kata sandi tidak cocok.');
    }

    public function test_sandi_baru_harus_berbeda_dari_sandi_lama(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/password', $this->data(['password' => self::LAMA, 'password_confirmation' => self::LAMA]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'Kata sandi baru harus berbeda dari kata sandi saat ini.');
    }

    public function test_sandi_baru_mengikuti_kebijakan_yang_sama_dengan_registrasi(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/password', $this->data(['password' => 'pendek', 'password_confirmation' => 'pendek']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        // Kebijakan diperketat lewat config -> berlaku juga di sini.
        config(['register.password.mixed_case' => true, 'register.password.numbers' => true]);

        $this->patchJson('/api/auth/password', $this->data(['password' => 'hurufkecilsaja', 'password_confirmation' => 'hurufkecilsaja']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_field_wajib_diisi(): void
    {
        $this->masuk();

        $this->patchJson('/api/auth/password', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password', 'password']);
    }

    public function test_butuh_login_dan_akun_aktif(): void
    {
        $this->patchJson('/api/auth/password', $this->data())->assertUnauthorized();

        Sanctum::actingAs(User::factory()->nonaktif()->create(['password' => self::LAMA]));
        $this->patchJson('/api/auth/password', $this->data())->assertForbidden();
    }
}
