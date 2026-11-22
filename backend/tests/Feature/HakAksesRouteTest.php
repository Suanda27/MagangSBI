<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** Middleware auth + akun.aktif + role:<peran> pada kelompok route per peran (routes/api.php). */
class HakAksesRouteTest extends TestCase
{
    use RefreshDatabase;

    private const PREFIX = [
        'employee' => Role::Employee,
        'supervisor' => Role::Supervisor,
        'pic' => Role::Pic,
        'admin' => Role::Admin,
    ];

    /** @return array<string, array{string}> */
    public static function modul(): array
    {
        return array_map(fn (string $prefix) => [$prefix], array_combine(array_keys(self::PREFIX), array_keys(self::PREFIX)));
    }

    /**
     * Semua kombinasi peran pengguna × modul: hanya yang cocok boleh masuk.
     *
     * @return array<string, array{string, string, bool}>
     */
    public static function matriks(): array
    {
        $kasus = [];
        foreach (array_keys(self::PREFIX) as $peran) {
            foreach (array_keys(self::PREFIX) as $modul) {
                $kasus["{$peran} → /{$modul}"] = [$peran, $modul, $peran === $modul];
            }
        }

        return $kasus;
    }

    private function buatPengguna(string $peran): User
    {
        return match ($peran) {
            'employee' => User::factory()->employee()->create(),
            'supervisor' => User::factory()->supervisor()->create(),
            'pic' => User::factory()->pic()->create(),
            'admin' => User::factory()->admin()->create(),
        };
    }

    #[DataProvider('modul')]
    public function test_tamu_ditolak_dengan_401(string $modul): void
    {
        $this->getJson("/api/{$modul}/ping")->assertUnauthorized();
    }

    #[DataProvider('matriks')]
    public function test_hanya_peran_yang_sesuai_boleh_masuk(string $peran, string $modul, bool $boleh): void
    {
        Sanctum::actingAs($this->buatPengguna($peran));

        $respons = $this->getJson("/api/{$modul}/ping");

        if ($boleh) {
            $respons->assertOk()->assertExactJson(['peran' => $peran]);
        } else {
            $respons->assertForbidden();
        }
    }

    #[DataProvider('modul')]
    public function test_akun_nonaktif_ditolak_walau_perannya_sesuai(string $modul): void
    {
        $nonaktif = match ($modul) {
            'employee' => User::factory()->employee()->nonaktif()->create(),
            'supervisor' => User::factory()->supervisor()->nonaktif()->create(),
            'pic' => User::factory()->pic()->nonaktif()->create(),
            'admin' => User::factory()->admin()->nonaktif()->create(),
        };
        Sanctum::actingAs($nonaktif);

        $this->getJson("/api/{$modul}/ping")
            ->assertForbidden()
            ->assertJsonPath('message', 'Akun Anda dinonaktifkan. Hubungi Administrator.');
    }

    public function test_ping_publik_tidak_butuh_login(): void
    {
        $this->getJson('/api/ping')->assertOk()->assertJsonPath('status', 'ok');
    }
}
