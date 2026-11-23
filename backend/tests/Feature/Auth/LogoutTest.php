<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** POST /api/auth/logout. */
class LogoutTest extends TestCase
{
    use RefreshDatabase;

    private function dariFrontend(): static
    {
        return $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/',
        ]);
    }

    public function test_logout_mengakhiri_sesi_dan_me_menjadi_401(): void
    {
        User::factory()->create(['email' => 'syifa@sbi.co.id', 'password' => 'Enterprise@2026']);

        $this->dariFrontend()->postJson('/api/auth/login', ['login' => 'syifa@sbi.co.id', 'password' => 'Enterprise@2026'])
            ->assertOk();
        $this->assertAuthenticated('web');

        $this->dariFrontend()->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Anda telah keluar.');

        $this->assertGuest('web');

        // Di server tiap request memuat ulang aplikasi; di tes kita lupakan guard yang tersimpan
        // supaya request berikutnya dinilai dari sesi (yang sudah dihapus), bukan dari cache guard.
        $this->app['auth']->forgetGuards();
        $this->dariFrontend()->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_logout_tanpa_login_ditolak(): void
    {
        $this->dariFrontend()->postJson('/api/auth/logout')->assertUnauthorized();
    }

    public function test_logout_tetap_berjalan_untuk_klien_yang_memakai_actingas(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/auth/logout')->assertOk();
    }
}
