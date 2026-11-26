<?php

namespace Tests\Feature\Supervisor;

use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Services\EksporTiket;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use OpenSpout\Reader\XLSX\Reader;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;
use ZipArchive;

/** GET /api/supervisor/laporan/ekspor: CSV, Excel, dan PDF untuk section sendiri. */
class EksporLaporanSupervisorTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    /** @var list<string> */
    private array $sementara = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    protected function tearDown(): void
    {
        foreach ($this->sementara as $berkas) {
            @unlink($berkas);
        }
        parent::tearDown();
    }

    private function tiket(array $tambah = [], bool $sectionLain = false): Permintaan
    {
        return Permintaan::factory()->create($tambah + [
            'id_layanan' => ($sectionLain ? $this->layananGa : $this->layananIs)->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => StatusPermintaan::Submitted,
        ]);
    }

    private function ekspor(string $query): TestResponse
    {
        return $this->get('/api/supervisor/laporan/ekspor?'.$query, ['Accept' => 'application/json']);
    }

    /** Simpan isi respons aliran sebagai berkas xlsx sementara dan baca semua barisnya. @return list<list<string>> */
    private function barisXlsx(TestResponse $res): array
    {
        $berkas = tempnam(sys_get_temp_dir(), 'ekspor').'.xlsx';
        $this->sementara[] = $berkas;
        file_put_contents($berkas, $res->streamedContent());

        $zip = new ZipArchive;
        $this->assertTrue($zip->open($berkas) === true, 'Isi respons harus berupa zip xlsx yang valid.');
        $this->assertNotFalse($zip->locateName('[Content_Types].xml'));
        $zip->close();

        $pembaca = new Reader;
        $pembaca->open($berkas);
        $baris = [];
        foreach ($pembaca->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $b) {
                $baris[] = array_map('strval', $b->toArray());
            }
        }
        $pembaca->close();

        return $baris;
    }

    private function jumlahRumus(TestResponse $res): int
    {
        $berkas = tempnam(sys_get_temp_dir(), 'ekspor').'.xlsx';
        $this->sementara[] = $berkas;
        file_put_contents($berkas, $res->streamedContent());
        $zip = new ZipArchive;
        $zip->open($berkas);
        $xml = (string) $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        return (int) preg_match_all('/<f[ >]/', $xml);
    }

    // ---- Hak akses dan validasi ---------------------------------------

    public function test_butuh_login_dan_hanya_untuk_supervisor(): void
    {
        $this->ekspor('format=csv')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->ekspor('format=csv')->assertForbidden();
        }
    }

    public function test_format_wajib_dan_harus_dikenal(): void
    {
        Sanctum::actingAs($this->supIs);

        $this->ekspor('')->assertUnprocessable()->assertJsonValidationErrors('format');
        $this->ekspor('format=docx')->assertUnprocessable()->assertJsonValidationErrors('format');
        $this->ekspor('format=csv&dari=2026-12-01&sampai=2026-11-01')->assertUnprocessable()->assertJsonValidationErrors('sampai');
    }

    // ---- CSV -----------------------------------------------------------

    public function test_csv_hanya_memuat_tiket_section_sendiri(): void
    {
        $milik = $this->tiket(['judul' => 'Printer IS rusak']);
        $lain = $this->tiket(['judul' => 'AC GA bocor'], sectionLain: true);

        Sanctum::actingAs($this->supIs);
        $res = $this->ekspor('format=csv')->assertOk();

        $this->assertStringContainsString('text/csv', (string) $res->headers->get('Content-Type'));
        $this->assertStringContainsString('.csv', (string) $res->headers->get('Content-Disposition'));
        $isi = $res->streamedContent();
        $this->assertStringContainsString($milik->kode_tiket, $isi);
        $this->assertStringNotContainsString($lain->kode_tiket, $isi);
    }

    // ---- Excel ---------------------------------------------------------

    public function test_excel_valid_dan_hanya_memuat_tiket_section_sendiri(): void
    {
        $milik = $this->tiket(['judul' => 'Printer IS rusak é ü']);
        $lain = $this->tiket(['judul' => 'AC GA bocor'], sectionLain: true);

        Sanctum::actingAs($this->supIs);
        $res = $this->ekspor('format=excel')->assertOk();

        $this->assertStringContainsString('.xlsx', (string) $res->headers->get('Content-Disposition'));
        $baris = $this->barisXlsx($res);

        $this->assertSame('Nomor Tiket', $baris[0][0]);
        $this->assertCount(2, $baris, 'Satu baris judul dan satu tiket milik section sendiri.');
        $this->assertSame($milik->kode_tiket, $baris[1][0]);
        $this->assertSame('Printer IS rusak é ü', $baris[1][1]);
        $this->assertNotContains($lain->kode_tiket, array_column($baris, 0));
    }

    public function test_excel_menetralkan_isian_berawalan_rumus(): void
    {
        $this->tiket(['judul' => '=HYPERLINK("http://jahat.example","klik")']);
        $this->tiket(['judul' => '+cmd|calc']);
        $this->tiket(['judul' => '@SUM(1+1)']);

        Sanctum::actingAs($this->supIs);
        $res = $this->ekspor('format=excel')->assertOk();

        $this->assertSame(0, $this->jumlahRumus($res), 'Tidak boleh ada sel rumus aktif.');
    }

    public function test_excel_menyimpan_teks_berawalan_rumus_apa_adanya(): void
    {
        $this->tiket(['judul' => '=1+1']);

        Sanctum::actingAs($this->supIs);
        $baris = $this->barisXlsx($this->ekspor('format=excel')->assertOk());

        $this->assertSame('=1+1', $baris[1][1], 'Teks tetap tersimpan utuh sebagai teks.');
    }

    // ---- PDF -----------------------------------------------------------

    public function test_pdf_valid_dengan_judul_berisi_markup(): void
    {
        $this->tiket(['judul' => '<script>alert(1)</script> & "petik" é']);

        Sanctum::actingAs($this->supIs);
        $res = $this->ekspor('format=pdf')->assertOk();

        $this->assertSame('application/pdf', $res->headers->get('Content-Type'));
        $this->assertStringContainsString('.pdf', (string) $res->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF-', $res->getContent());
    }

    public function test_pdf_tanpa_tiket_tetap_menghasilkan_berkas(): void
    {
        Sanctum::actingAs($this->supIs);
        $this->assertStringStartsWith('%PDF-', $this->ekspor('format=pdf')->assertOk()->getContent());
    }

    public function test_pdf_ditolak_bila_baris_melebihi_batas(): void
    {
        Permintaan::factory()->count(EksporTiket::MAKS_BARIS_PDF + 1)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => StatusPermintaan::Submitted,
        ]);

        Sanctum::actingAs($this->supIs);
        $this->ekspor('format=pdf')->assertUnprocessable()->assertJsonValidationErrors('format');

        // CSV dan Excel tidak dibatasi karena ditulis berangsur-angsur.
        $this->ekspor('format=csv')->assertOk();
    }

    // ---- Cakupan dan filter -------------------------------------------

    public function test_parameter_cakupan_dari_klien_diabaikan(): void
    {
        $lain = $this->tiket(sectionLain: true);

        Sanctum::actingAs($this->supIs);
        $isi = $this->ekspor('format=csv&id_bagian='.$this->bagianGa->id)->assertOk()->streamedContent();

        $this->assertStringNotContainsString($lain->kode_tiket, $isi);
    }

    public function test_supervisor_tanpa_section_mendapat_berkas_kosong(): void
    {
        $this->tiket();
        $this->supIs->update(['id_bagian' => null]);

        Sanctum::actingAs($this->supIs->fresh());
        $baris = $this->barisXlsx($this->ekspor('format=excel')->assertOk());

        $this->assertCount(1, $baris, 'Hanya baris judul.');
    }

    public function test_filter_status_dan_tanggal_dihormati(): void
    {
        $selesai = $this->tiket(['status' => StatusPermintaan::Completed, 'selesai_pada' => now()]);
        $baru = $this->tiket();
        $lama = $this->tiket(['created_at' => CarbonImmutable::parse('2026-01-10 10:00:00')]);

        Sanctum::actingAs($this->supIs);

        $isi = $this->ekspor('format=csv&status=completed')->assertOk()->streamedContent();
        $this->assertStringContainsString($selesai->kode_tiket, $isi);
        $this->assertStringNotContainsString($baru->kode_tiket, $isi);

        $isi = $this->ekspor('format=csv&dari=2026-01-01&sampai=2026-01-31')->assertOk()->streamedContent();
        $this->assertStringContainsString($lama->kode_tiket, $isi);
        $this->assertStringNotContainsString($baru->kode_tiket, $isi);
    }

    // ---- Pembatasan laju -----------------------------------------------

    public function test_ekspor_dibatasi_20_permintaan_per_menit(): void
    {
        Sanctum::actingAs($this->supIs);

        for ($i = 0; $i < 20; $i++) {
            $this->ekspor('format=csv')->assertOk()->streamedContent();
        }

        $this->ekspor('format=csv')->assertStatus(429);
    }
}
