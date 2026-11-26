<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Permintaan ke endpoint terlindungi TANPA login harus dijawab 401 berformat JSON, apa pun header Accept-nya.
 * Dulu, tanpa "Accept: application/json", framework mencari rute bernama "login" yang tidak ada di API ini
 * dan menjawab 500 (RouteNotFoundException), bahkan dengan rincian pengecualian saat mode debug menyala.
 */
class TanpaLoginTest extends TestCase
{
    use RefreshDatabase;

    /** @return list<array{string}> */
    public static function endpointTerlindungi(): array
    {
        return [
            ['/api/auth/me'],
            ['/api/notifikasi'],
            ['/api/employee/dashboard'],
            ['/api/supervisor/dashboard'],
            ['/api/pic/dashboard'],
            ['/api/admin/dashboard'],
            ['/api/admin/laporan/ekspor'],
        ];
    }

    /** @dataProvider endpointTerlindungi */
    #[DataProvider('endpointTerlindungi')]
    public function test_tanpa_login_dijawab_401_walau_tanpa_header_json(string $url): void
    {
        $res = $this->get($url); // sengaja tanpa Accept: application/json

        $res->assertStatus(401);
        $this->assertStringContainsString('application/json', (string) $res->headers->get('content-type'));
        $res->assertJsonStructure(['message']);
        $this->assertArrayNotHasKey('exception', $res->json(), 'Rincian pengecualian tidak boleh bocor ke klien.');
        $this->assertArrayNotHasKey('file', $res->json());
    }

    #[DataProvider('endpointTerlindungi')]
    public function test_dengan_header_json_tetap_401(string $url): void
    {
        $this->getJson($url)->assertStatus(401);
    }

    public function test_endpoint_publik_tidak_terpengaruh(): void
    {
        $this->get('/api/ping')->assertOk();
    }
}
