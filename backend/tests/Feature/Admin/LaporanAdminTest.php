<?php

namespace Tests\Feature\Admin;

use App\Enums\StatusPermintaan;
use App\Models\Layanan;
use App\Models\Permintaan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/admin/laporan dan /api/admin/laporan/ekspor. */
class LaporanAdminTest extends TestCase
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

    // ---- Hak akses -----------------------------------------------------

    public function test_hanya_admin_yang_boleh(): void
    {
        foreach (['/api/admin/laporan', '/api/admin/laporan/ekspor'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $akun) {
            Sanctum::actingAs($akun);
            foreach (['/api/admin/laporan', '/api/admin/laporan/ekspor'] as $url) {
                $this->getJson($url)->assertForbidden();
            }
        }
    }

    // ---- Ringkasan -----------------------------------------------------

    public function test_ringkasan_menghitung_status_section_dan_layanan_teratas(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Rejected, ['id_pic' => $this->picIs->id]);
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);

        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/admin/laporan')->assertOk()
            ->assertJsonPath('meta.total', 5)
            ->assertJsonPath('ringkasan.total', 5)
            ->assertJsonPath('ringkasan.per_status.submitted', 2)
            ->assertJsonPath('ringkasan.per_status.in_progress', 1)
            ->assertJsonPath('ringkasan.per_status.completed', 1)
            ->assertJsonPath('ringkasan.per_status.rejected', 1)
            ->assertJsonPath('ringkasan.per_status.pending', 0);

        $section = collect($res->json('ringkasan.per_section'));
        $this->assertSame('IS', $section->first()['kode_bagian']);
        $this->assertSame(4, $section->first()['jumlah']);
        $this->assertSame(1, $section->firstWhere('kode_bagian', 'GA')['jumlah']);

        $top = collect($res->json('ringkasan.top_layanan'));
        $this->assertSame($this->layananIs->nama_layanan, $top->first()['nama_layanan']);
        $this->assertSame(4, $top->first()['jumlah']);
    }

    public function test_layanan_teratas_dibatasi_lima(): void
    {
        foreach (range(1, 7) as $i) {
            $l = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id]);
            Permintaan::factory()->create(['id_layanan' => $l->id, 'id_karyawan' => $this->karyawan->id]);
        }
        Sanctum::actingAs($this->admin);

        $this->assertCount(5, $this->getJson('/api/admin/laporan')->assertOk()->json('ringkasan.top_layanan'));
    }

    public function test_statistik_selesai_rata_rata_jam_dan_tanpa_revisi(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['created_at' => now()->subHours(10), 'selesai_pada' => now(), 'jumlah_revisi' => 0]);
        $this->tiket(StatusPermintaan::Completed, ['created_at' => now()->subHours(20), 'selesai_pada' => now(), 'jumlah_revisi' => 2]);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/laporan')->assertOk()
            ->assertJsonPath('ringkasan.selesai.jumlah', 2)
            ->assertJsonPath('ringkasan.selesai.rata_rata_jam', 15)
            ->assertJsonPath('ringkasan.selesai.tanpa_revisi_persen', 50);
    }

    public function test_tanpa_tiket_selesai_statistiknya_kosong_bukan_nol(): void
    {
        $this->tiket(StatusPermintaan::Submitted);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/laporan')->assertOk()
            ->assertJsonPath('ringkasan.selesai.jumlah', 0)
            ->assertJsonPath('ringkasan.selesai.rata_rata_jam', null)
            ->assertJsonPath('ringkasan.selesai.tanpa_revisi_persen', null);
    }

    // ---- Filter --------------------------------------------------------

    public function test_filter_dipakai_serentak_pada_rekap_dan_ringkasan(): void
    {
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs2->id, 'selesai_pada' => now()]);
        $this->tiket(StatusPermintaan::Submitted);
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/laporan?id_bagian='.$this->bagianGa->id)->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('ringkasan.total', 1);

        $this->getJson('/api/admin/laporan?status=completed')->assertOk()
            ->assertJsonPath('meta.total', 2)->assertJsonPath('ringkasan.per_status.submitted', 0);

        $this->getJson('/api/admin/laporan?id_pic='.$this->picIs->id)->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.pic.id', $this->picIs->id);

        $this->getJson('/api/admin/laporan?id_layanan='.$this->layananGa->id)->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_rentang_tanggal_mencakup_seluruh_hari_awal_dan_akhir(): void
    {
        $this->tiket(StatusPermintaan::Submitted, ['created_at' => '2026-03-09 23:59:00']); // sebelum
        $awal = $this->tiket(StatusPermintaan::Submitted, ['created_at' => '2026-03-10 00:00:00']);
        $akhir = $this->tiket(StatusPermintaan::Submitted, ['created_at' => '2026-03-12 23:59:59']);
        $this->tiket(StatusPermintaan::Submitted, ['created_at' => '2026-03-13 00:00:00']); // sesudah
        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/admin/laporan?dari=2026-03-10&sampai=2026-03-12')->assertOk()
            ->assertJsonPath('meta.total', 2)->assertJsonPath('ringkasan.total', 2);

        $this->assertEqualsCanonicalizing([$awal->kode_tiket, $akhir->kode_tiket], collect($res->json('data'))->pluck('kode_tiket')->all());

        // Hanya satu sisi juga boleh.
        $this->getJson('/api/admin/laporan?dari=2026-03-12')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/admin/laporan?sampai=2026-03-10')->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_parameter_tidak_valid_422(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/laporan?dari=kemarin')->assertUnprocessable()->assertJsonValidationErrors('dari');
        $this->getJson('/api/admin/laporan?dari=2026-03-12&sampai=2026-03-10')->assertUnprocessable()->assertJsonValidationErrors('sampai');
        $this->getJson('/api/admin/laporan?status=ngawur')->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->getJson('/api/admin/laporan?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/admin/laporan/ekspor?dari=kemarin')->assertUnprocessable();
    }

    public function test_paginasi_rekap(): void
    {
        foreach (range(1, 3) as $i) {
            $this->tiket();
        }
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/laporan?per_page=2')->assertOk()
            ->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 3)->assertJsonPath('ringkasan.total', 3);
    }

    // ---- Ekspor CSV ----------------------------------------------------

    private function csv(string $url = '/api/admin/laporan/ekspor'): array
    {
        $res = $this->get($url)->assertOk();
        $this->assertStringContainsString('text/csv', (string) $res->headers->get('content-type'));
        $this->assertStringContainsString('laporan-tiket-', (string) $res->headers->get('content-disposition'));

        $isi = $res->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $isi); // BOM UTF-8

        return array_map(fn ($baris) => str_getcsv($baris, ';'), array_values(array_filter(explode("\n", str_replace("\r\n", "\n", substr($isi, 3))))));
    }

    public function test_ekspor_memuat_header_dan_semua_baris_terfilter(): void
    {
        $a = $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id, 'selesai_pada' => now(), 'judul' => 'Printer rusak']);
        $this->tiket(StatusPermintaan::Submitted, [], untukGa: true);
        Sanctum::actingAs($this->admin);

        $semua = $this->csv();
        $this->assertSame('Nomor Tiket', $semua[0][0]);
        $this->assertCount(3, $semua); // header + 2 tiket

        $terfilter = $this->csv('/api/admin/laporan/ekspor?status=completed');
        $this->assertCount(2, $terfilter);
        $this->assertSame($a->kode_tiket, $terfilter[1][0]);
        $this->assertSame('Printer rusak', $terfilter[1][1]);
        $this->assertSame($this->karyawan->name, $terfilter[1][4]);
        $this->assertSame($this->picIs->name, $terfilter[1][7]);
        $this->assertSame('Selesai', $terfilter[1][11]);
    }

    public function test_ekspor_tidak_dibatasi_halaman_rekap(): void
    {
        foreach (range(1, 5) as $i) {
            $this->tiket();
        }
        Sanctum::actingAs($this->admin);

        $this->assertCount(6, $this->csv('/api/admin/laporan/ekspor?per_page=2')); // tetap seluruh hasil filter
    }

    public function test_ekspor_menetralkan_rumus_excel(): void
    {
        $this->tiket(StatusPermintaan::Submitted, ['judul' => '=HYPERLINK("http://jahat.example","klik")']);
        $this->tiket(StatusPermintaan::Submitted, ['judul' => '+cmd|calc']);
        $this->tiket(StatusPermintaan::Submitted, ['judul' => '@SUM(1+1)']);
        $this->tiket(StatusPermintaan::Submitted, ['judul' => '-2+3']);
        Sanctum::actingAs($this->admin);

        $judul = collect($this->csv())->skip(1)->pluck(1)->all();

        $this->assertCount(4, $judul);
        foreach ($judul as $j) {
            $this->assertStringStartsWith("'", $j, 'Sel berawalan karakter rumus harus diberi tanda petik: '.$j);
        }
    }

    public function test_ekspor_menjaga_titik_koma_dan_baris_baru_dalam_isian(): void
    {
        $this->tiket(StatusPermintaan::Submitted, ['judul' => 'Judul; dengan titik koma "dan petik"']);
        Sanctum::actingAs($this->admin);

        $res = $this->get('/api/admin/laporan/ekspor')->assertOk();
        $baris = str_getcsv(explode("\n", $res->streamedContent())[1], ';');

        $this->assertSame('Judul; dengan titik koma "dan petik"', $baris[1]);
        $this->assertCount(16, $baris);
    }
}
