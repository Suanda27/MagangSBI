<?php

namespace Tests\Feature;

use App\Models\Bagian;
use App\Models\Lantai;
use App\Models\Layanan;
use App\Models\Pengaturan;
use App\Models\Plant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Endpoint referensi untuk form pengajuan: layanan, lokasi, aturan lampiran. */
class ReferensiPengajuanTest extends TestCase
{
    use RefreshDatabase;

    private function login(): void
    {
        Sanctum::actingAs(User::factory()->employee(Bagian::factory()->create())->create());
    }

    public function test_semua_endpoint_butuh_login(): void
    {
        $this->getJson('/api/referensi/layanan?bagian=1')->assertUnauthorized();
        $this->getJson('/api/referensi/lokasi')->assertUnauthorized();
        $this->getJson('/api/referensi/aturan-lampiran')->assertUnauthorized();
    }

    public function test_layanan_dikelompokkan_per_kategori_dan_hanya_yang_aktif_dari_section_itu(): void
    {
        $is = Bagian::factory()->create();
        $ga = Bagian::factory()->create();
        Layanan::factory()->create(['id_bagian' => $is->id, 'kategori' => 'Dukungan IT', 'nama_layanan' => 'Reset Akun']);
        Layanan::factory()->create(['id_bagian' => $is->id, 'kategori' => 'Dukungan IT', 'nama_layanan' => 'Instal Software']);
        Layanan::factory()->create(['id_bagian' => $is->id, 'kategori' => 'Jaringan', 'nama_layanan' => 'Akses VPN']);
        Layanan::factory()->nonaktif()->create(['id_bagian' => $is->id, 'kategori' => 'Jaringan', 'nama_layanan' => 'Layanan Mati']);
        Layanan::factory()->create(['id_bagian' => $ga->id, 'nama_layanan' => 'Layanan GA']);

        Sanctum::actingAs(User::factory()->employee($is)->create());

        $res = $this->getJson('/api/referensi/layanan?bagian='.$is->id)->assertOk();

        $res->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.kategori', 'Dukungan IT')
            ->assertJsonCount(2, 'data.0.layanan')
            ->assertJsonPath('data.1.kategori', 'Jaringan')
            ->assertJsonCount(1, 'data.1.layanan');

        $this->assertStringNotContainsString('Layanan Mati', $res->getContent());
        $this->assertStringNotContainsString('Layanan GA', $res->getContent());
    }

    public function test_layanan_menolak_bagian_kosong_atau_tidak_ada(): void
    {
        $this->login();

        $this->getJson('/api/referensi/layanan')->assertUnprocessable()->assertJsonValidationErrors('bagian');
        $this->getJson('/api/referensi/layanan?bagian=99999')->assertUnprocessable()->assertJsonValidationErrors('bagian');
    }

    public function test_lokasi_mengembalikan_plant_beserta_lantainya(): void
    {
        $p1 = Plant::factory()->create(['nama_plant' => 'Plant 1']);
        $p3 = Plant::factory()->create(['nama_plant' => 'Plant 3']);
        foreach (['Lantai 1', 'Lantai 2', 'Lantai 3'] as $nama) {
            Lantai::factory()->create(['nama_lantai' => $nama, 'id_plant' => $p1->id]);
        }
        foreach (['Lantai 1', 'Lantai 2'] as $nama) {
            Lantai::factory()->create(['nama_lantai' => $nama, 'id_plant' => $p3->id]);
        }

        $this->login();

        $this->getJson('/api/referensi/lokasi')
            ->assertOk()
            ->assertJsonPath('data.0.nama_plant', 'Plant 1')
            ->assertJsonCount(3, 'data.0.lantais')
            ->assertJsonPath('data.1.nama_plant', 'Plant 3')
            ->assertJsonCount(2, 'data.1.lantais');
    }

    public function test_aturan_lampiran_mengikuti_tabel_pengaturan(): void
    {
        Pengaturan::simpan('max_upload_mb', 3);
        Pengaturan::simpan('format_lampiran', 'JPG, png');
        $this->login();

        $this->getJson('/api/referensi/aturan-lampiran')
            ->assertOk()
            ->assertExactJson(['data' => ['maks_berkas' => 5, 'maks_ukuran_mb' => 3, 'format' => ['jpg', 'png']]]);
    }

    public function test_aturan_lampiran_memakai_nilai_bawaan_bila_belum_diatur(): void
    {
        $this->login();

        $this->getJson('/api/referensi/aturan-lampiran')
            ->assertOk()
            ->assertExactJson(['data' => ['maks_berkas' => 5, 'maks_ukuran_mb' => 5, 'format' => ['jpg', 'png', 'pdf']]]);
    }
}
