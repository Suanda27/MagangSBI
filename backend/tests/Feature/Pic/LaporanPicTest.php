<?php

namespace Tests\Feature\Pic;

use App\Enums\StatusPermintaan;
use App\Models\Layanan;
use App\Models\Permintaan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/pic/laporan dan /api/pic/laporan/ekspor. */
class LaporanPicTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status, array $tambah = []): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_hanya_pic_yang_boleh(): void
    {
        foreach (['/api/pic/laporan', '/api/pic/laporan/ekspor'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }

        foreach ([$this->karyawan, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            foreach (['/api/pic/laporan', '/api/pic/laporan/ekspor'] as $url) {
                $this->getJson($url)->assertForbidden();
            }
        }
    }

    // ---- Statistik pribadi ---------------------------------------------

    public function test_hanya_tiket_yang_ditangani_pic_ini_yang_dihitung(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Rejected, ['id_pic' => $this->picIs->id]);
        // Bukan milik PIC ini: rekan, antrean, dan section lain.
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs2->id, 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Submitted);
        Permintaan::factory()->create(['id_layanan' => $this->layananGa->id, 'id_karyawan' => $this->karyawan->id, 'id_pic' => $this->picGa->id, 'status' => StatusPermintaan::Completed, 'selesai_pada' => now()]);

        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/laporan')->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.per_status.completed', 1)
            ->assertJsonPath('data.per_status.in_progress', 1)
            ->assertJsonPath('data.per_status.rejected', 1)
            ->assertJsonPath('data.per_status.submitted', 0)
            ->assertJsonPath('data.antrean_saat_ini', 1);

        // Rekan melihat angkanya sendiri, bukan milik PIC pertama.
        Sanctum::actingAs($this->picIs2);
        $this->getJson('/api/pic/laporan')->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.antrean_saat_ini', 1);

        Sanctum::actingAs($this->picGa);
        $this->getJson('/api/pic/laporan')->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.antrean_saat_ini', 0);
    }

    public function test_rata_rata_waktu_dan_persen_tanpa_revisi(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'created_at' => now()->subHours(10), 'selesai_pada' => now(), 'jumlah_revisi' => 0]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'created_at' => now()->subHours(20), 'selesai_pada' => now(), 'jumlah_revisi' => 3]);
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/laporan')->assertOk()
            ->assertJsonPath('data.selesai.jumlah', 2)
            ->assertJsonPath('data.selesai.rata_rata_jam', 15)
            ->assertJsonPath('data.selesai.tanpa_revisi_persen', 50);
    }

    public function test_tanpa_tiket_selesai_statistiknya_kosong_bukan_nol(): void
    {
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/laporan')->assertOk()
            ->assertJsonPath('data.selesai.rata_rata_jam', null)
            ->assertJsonPath('data.selesai.tanpa_revisi_persen', null);
    }

    public function test_kategori_layanan_teratas_dan_section_pengaju(): void
    {
        $layananLain = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id, 'kategori' => 'Kategori Lain']);

        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'created_at' => now()->subHours(4), 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Permintaan::factory()->create(['id_layanan' => $layananLain->id, 'id_karyawan' => $this->karyawanLain->id, 'id_pic' => $this->picIs->id, 'status' => StatusPermintaan::InProgress]);
        Sanctum::actingAs($this->picIs);

        $res = $this->getJson('/api/pic/laporan')->assertOk();

        $top = collect($res->json('data.top_layanan'));
        $this->assertSame($this->layananIs->nama_layanan, $top->first()['nama_layanan']);
        $this->assertSame(2, $top->first()['jumlah']);
        $this->assertSame(1, $top->first()['selesai']);
        $this->assertSame(4, (int) $top->first()['rata_rata_jam']);
        $this->assertNull($top->firstWhere('nama_layanan', $layananLain->nama_layanan)['rata_rata_jam']);

        $kategori = collect($res->json('data.per_kategori'));
        $this->assertSame(3, $kategori->sum('jumlah'));
        $this->assertContains('Kategori Lain', $kategori->pluck('kategori')->all());

        // Kedua karyawan berasal dari section GA.
        $bagian = collect($res->json('data.per_bagian_pengaju'));
        $this->assertSame($this->bagianGa->nama_bagian, $bagian->first()['nama_bagian']);
        $this->assertSame(3, $bagian->first()['jumlah']);
    }

    // ---- Filter --------------------------------------------------------

    public function test_filter_rentang_tanggal_dan_section_pengaju(): void
    {
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id, 'created_at' => '2026-03-10 08:00:00']);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id, 'created_at' => '2026-03-09 23:59:00']);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id, 'created_at' => '2026-03-13 00:00:00']);
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/laporan?dari=2026-03-10&sampai=2026-03-12')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/pic/laporan?dari=2026-03-12')->assertOk()->assertJsonPath('data.total', 1);

        // Section pengaju: karyawan section GA ada, section IS tidak.
        $this->getJson('/api/pic/laporan?id_bagian_pengaju='.$this->bagianGa->id)->assertOk()->assertJsonPath('data.total', 3);
        $this->getJson('/api/pic/laporan?id_bagian_pengaju='.$this->bagianIs->id)->assertOk()->assertJsonPath('data.total', 0);

    }

    public function test_parameter_tidak_valid_422(): void
    {
        Sanctum::actingAs($this->picIs);

        $this->getJson('/api/pic/laporan?dari=kemarin')->assertUnprocessable()->assertJsonValidationErrors('dari');
        $this->getJson('/api/pic/laporan?dari=2026-03-12&sampai=2026-03-10')->assertUnprocessable()->assertJsonValidationErrors('sampai');
        $this->getJson('/api/pic/laporan?id_bagian_pengaju=abc')->assertUnprocessable()->assertJsonValidationErrors('id_bagian_pengaju');
        $this->getJson('/api/pic/laporan/ekspor?dari=kemarin')->assertUnprocessable();
    }

    // ---- Ekspor CSV ----------------------------------------------------

    /** @return list<list<string>> */
    private function csv(string $url = '/api/pic/laporan/ekspor'): array
    {
        $res = $this->get($url)->assertOk();
        $this->assertStringContainsString('text/csv', (string) $res->headers->get('content-type'));
        $this->assertStringContainsString('laporan-pic-', (string) $res->headers->get('content-disposition'));

        $isi = $res->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $isi);

        return array_map(fn ($baris) => str_getcsv($baris, ';'), array_values(array_filter(explode("\n", str_replace("\r\n", "\n", substr($isi, 3))))));
    }

    public function test_ekspor_hanya_memuat_tiket_milik_pic_ini(): void
    {
        $milikku = $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'selesai_pada' => now(), 'judul' => 'Printer rusak']);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs2->id, 'selesai_pada' => now(), 'judul' => 'Milik rekan']);
        $this->tiket(StatusPermintaan::Submitted, ['judul' => 'Masih antrean']);
        Sanctum::actingAs($this->picIs);

        $baris = $this->csv();

        $this->assertCount(2, $baris); // header + satu tiket
        $this->assertSame($milikku->kode_tiket, $baris[1][0]);
        $this->assertSame('Printer rusak', $baris[1][1]);
        $this->assertSame($this->picIs->name, $baris[1][7]);
    }

    public function test_ekspor_menetralkan_rumus_excel_dan_mengikuti_filter(): void
    {
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id, 'judul' => '=HYPERLINK("http://jahat.example","klik")', 'created_at' => '2026-03-10 08:00:00']);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id, 'judul' => 'Di luar rentang', 'created_at' => '2026-02-01 08:00:00']);
        Sanctum::actingAs($this->picIs);

        $baris = $this->csv('/api/pic/laporan/ekspor?dari=2026-03-01&sampai=2026-03-31');

        $this->assertCount(2, $baris);
        $this->assertStringStartsWith("'=", $baris[1][1]);
    }
}
