<?php

namespace Tests\Feature\Pic;

use App\Enums\JenisLampiran;
use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use App\Models\Lampiran;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/pic/dashboard, /api/pic/permintaan, dan /api/pic/permintaan/{id}. */
class BacaPermintaanPicTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], bool $untukGa = false): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => ($untukGa ? $this->layananGa : $this->layananIs)->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    private function lampiran(Permintaan $tiket, JenisLampiran $jenis, ?int $putaran = null): Lampiran
    {
        return Lampiran::create([
            'id_permintaan' => $tiket->id, 'id_user' => $this->picIs->id, 'jenis' => $jenis, 'putaran' => $putaran,
            'nama_file' => 'berkas.png', 'path_file' => 'lampiran/x/berkas.png', 'tipe_file' => 'image/png', 'ukuran_file' => 1000,
        ]);
    }

    /** @return list<string> kode tiket dari respons daftar */
    private function kode(string $url): array
    {
        return collect($this->getJson($url)->assertOk()->json('data'))->pluck('kode_tiket')->all();
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_pic(): void
    {
        $tiket = $this->tiket();

        foreach (['/api/pic/dashboard', '/api/pic/permintaan', '/api/pic/permintaan/'.$tiket->id] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }

        foreach ([$this->karyawan, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            foreach (['/api/pic/dashboard', '/api/pic/permintaan', '/api/pic/permintaan/'.$tiket->id] as $url) {
                $this->getJson($url)->assertForbidden();
            }
        }
    }

    // ---- Dashboard -----------------------------------------------------

    public function test_dashboard_menghitung_antrean_section_dan_tiket_milik_sendiri(): void
    {
        $this->tiket();                                              // antrean IS
        $this->tiket();                                              // antrean IS
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true); // antrean section lain
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Pending, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::WaitingReview, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Rejected, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs2->id]); // milik PIC lain

        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/dashboard')->assertOk()
            ->assertJsonPath('data.antrean', 2)
            ->assertJsonPath('data.sedang_diproses', 1)
            ->assertJsonPath('data.pending', 1)
            ->assertJsonPath('data.menunggu_konfirmasi', 1)
            ->assertJsonPath('data.selesai', 1)
            ->assertJsonPath('data.ditolak', 1)
            ->assertJsonCount(2, 'data.antrean_teratas');
    }

    public function test_antrean_dilihat_bersama_oleh_semua_pic_section(): void
    {
        $this->tiket();

        foreach ([$this->picIs, $this->picIs2] as $pic) {
            Sanctum::actingAs($pic);
            $this->getJson('/api/pic/dashboard')->assertJsonPath('data.antrean', 1);
        }

        Sanctum::actingAs($this->picGa);
        $this->getJson('/api/pic/dashboard')->assertJsonPath('data.antrean', 0);
    }

    public function test_dashboard_membatasi_antrean_teratas_lima_dan_mengurutkan_prioritas(): void
    {
        foreach (range(1, 6) as $i) {
            $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Normal]);
        }
        $mendesak = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Mendesak]);

        Sanctum::actingAs($this->picIs);

        $res = $this->getJson('/api/pic/dashboard')->assertOk()
            ->assertJsonPath('data.antrean', 7)
            ->assertJsonCount(5, 'data.antrean_teratas');

        $this->assertSame($mendesak->kode_tiket, $res->json('data.antrean_teratas.0.kode_tiket'));
    }

    // ---- Daftar --------------------------------------------------------

    public function test_tab_masuk_hanya_antrean_section_dan_urut_prioritas_lalu_terlama(): void
    {
        $normalLama = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Normal, 'created_at' => now()->subDays(3)]);
        $normalBaru = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Normal, 'created_at' => now()->subDay()]);
        $tinggi = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Tinggi, 'created_at' => now()->subHour()]);
        $mendesak = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Mendesak, 'created_at' => now()]);
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);                      // section lain
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);        // sudah diambil

        Sanctum::actingAs($this->picIs);

        $this->assertSame(
            [$mendesak->kode_tiket, $tinggi->kode_tiket, $normalLama->kode_tiket, $normalBaru->kode_tiket],
            $this->kode('/api/pic/permintaan?tab=masuk'),
        );
        // tab bawaan = masuk
        $this->assertSame(4, count($this->kode('/api/pic/permintaan')));
    }

    public function test_tab_diproses_hanya_tiket_yang_ditangani_pic_ini_dan_belum_final(): void
    {
        $a = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $b = $this->tiket(StatusPermintaan::Pending, ['id_pic' => $this->picIs->id]);
        $c = $this->tiket(StatusPermintaan::WaitingReview, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs2->id]);
        $this->tiket(StatusPermintaan::Submitted);

        Sanctum::actingAs($this->picIs);

        $kode = $this->kode('/api/pic/permintaan?tab=diproses');
        $this->assertEqualsCanonicalizing([$a->kode_tiket, $b->kode_tiket, $c->kode_tiket], $kode);

        $this->assertSame([$b->kode_tiket], $this->kode('/api/pic/permintaan?tab=diproses&status=pending'));
    }

    public function test_tab_selesai_memuat_selesai_dan_ditolak_milik_sendiri(): void
    {
        $selesai = $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        $ditolak = $this->tiket(StatusPermintaan::Rejected, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs2->id]);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->picIs);

        $this->assertEqualsCanonicalizing(
            [$selesai->kode_tiket, $ditolak->kode_tiket],
            $this->kode('/api/pic/permintaan?tab=selesai'),
        );
        $this->assertSame([$ditolak->kode_tiket], $this->kode('/api/pic/permintaan?tab=selesai&status=rejected'));
    }

    public function test_status_di_luar_tab_tidak_membocorkan_tiket_tab_lain(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);

        Sanctum::actingAs($this->picIs);

        // "completed" bukan status tab diproses -> irisan kosong, bukan semua tiket.
        $this->assertSame([], $this->kode('/api/pic/permintaan?tab=diproses&status=completed'));
    }

    public function test_filter_prioritas_layanan_dan_kata_kunci(): void
    {
        $cocok = $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Mendesak, 'judul' => 'Printer lantai dua rusak']);
        $this->tiket(StatusPermintaan::Submitted, ['prioritas' => Prioritas::Normal, 'judul' => 'Permintaan lain']);

        Sanctum::actingAs($this->picIs);

        $this->assertSame([$cocok->kode_tiket], $this->kode('/api/pic/permintaan?prioritas=mendesak'));
        $this->assertSame([$cocok->kode_tiket], $this->kode('/api/pic/permintaan?q=printer'));
        $this->assertSame([$cocok->kode_tiket], $this->kode('/api/pic/permintaan?q='.urlencode($cocok->kode_tiket)));
        $this->assertSame(2, count($this->kode('/api/pic/permintaan?layanan='.$this->layananIs->id)));
        $this->assertSame([], $this->kode('/api/pic/permintaan?layanan='.$this->layananGa->id));
    }

    public function test_daftar_menyertakan_pengaju_dan_label_umum_serta_paginasi(): void
    {
        foreach (range(1, 3) as $i) {
            $this->tiket();
        }

        Sanctum::actingAs($this->picIs);

        $res = $this->getJson('/api/pic/permintaan?per_page=2')->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('data.0.status_label', 'Menunggu Pemeriksaan')
            ->assertJsonPath('data.0.pengaju.name', $this->karyawan->name);

        $this->assertArrayNotHasKey('email', $res->json('data.0.pengaju'));
    }

    public function test_parameter_tidak_valid_ditolak_422(): void
    {
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/permintaan?tab=semua')->assertUnprocessable()->assertJsonValidationErrors('tab');
        $this->getJson('/api/pic/permintaan?status=ngawur')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->getJson('/api/pic/permintaan?prioritas=biasa')->assertUnprocessable()->assertJsonValidationErrors('prioritas');
        $this->getJson('/api/pic/permintaan?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    }

    // ---- Detail --------------------------------------------------------

    public function test_detail_tiket_antrean_section_sendiri_lengkap_dengan_pengaju(): void
    {
        $tiket = $this->tiket();
        $this->lampiran($tiket, JenisLampiran::Pengajuan);

        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/permintaan/'.$tiket->id)->assertOk()
            ->assertJsonPath('data.id', $tiket->id)
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.status_label', 'Menunggu Pemeriksaan')
            ->assertJsonPath('data.pengaju.name', $this->karyawan->name)
            ->assertJsonPath('data.pengaju.bagian', $this->bagianGa->nama_bagian)
            ->assertJsonCount(1, 'data.lampiran')
            ->assertJsonMissingPath('data.bisa_ditinjau');
    }

    public function test_detail_tiket_yang_ditangani_sendiri_memuat_riwayat_dan_hasil_kerja(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview, ['id_pic' => $this->picIs->id, 'catatan_hasil' => 'Sudah diganti']);
        $this->lampiran($tiket, JenisLampiran::Penyelesaian, 1);

        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/permintaan/'.$tiket->id)->assertOk()
            ->assertJsonPath('data.hasil_kerja.catatan', 'Sudah diganti')
            ->assertJsonCount(1, 'data.hasil_kerja.putaran')
            ->assertJsonPath('data.pic.id', $this->picIs->id);
    }

    public function test_detail_tiket_section_lain_atau_milik_pic_lain_ditolak_403(): void
    {
        $sectionLain = $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);
        $milikRekan = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs2->id]);

        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/permintaan/'.$sectionLain->id)->assertForbidden();
        $this->getJson('/api/pic/permintaan/'.$milikRekan->id)->assertForbidden();
    }

    public function test_detail_tiket_tidak_ada_dijawab_404(): void
    {
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/permintaan/999999')->assertNotFound();
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $nonaktif = User::factory()->pic($this->bagianIs)->nonaktif()->create();
        Sanctum::actingAs($nonaktif);

        $this->getJson('/api/pic/dashboard')->assertForbidden();
    }
}
