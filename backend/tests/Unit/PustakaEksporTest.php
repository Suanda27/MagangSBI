<?php

namespace Tests\Unit;

use Dompdf\Dompdf;
use Dompdf\Options;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use PHPUnit\Framework\TestCase;
use ZipArchive;

/**
 * Menjaga pustaka ekspor (dompdf untuk PDF, OpenSpout untuk Excel) tetap menghasilkan berkas valid dan aman.
 * Tes ini memakai pustakanya langsung, tanpa database; layanan ekspor aplikasi (EksporTiket) dibangun di atasnya.
 *
 * PENTING untuk penulis layanan ekspor: OpenSpout memperlakukan teks berawalan "=" sebagai RUMUS Excel
 * bila sel dibuat lewat Row::fromValues(). Isian pengguna (judul tiket, nama, alasan) HARUS dibungkus StringCell.
 */
class PustakaEksporTest extends TestCase
{
    /** @var list<string> */
    private array $sementara = [];

    protected function tearDown(): void
    {
        foreach ($this->sementara as $berkas) {
            @unlink($berkas);
        }
        parent::tearDown();
    }

    private function berkasSementara(string $akhiran): string
    {
        $dasar = tempnam(sys_get_temp_dir(), 'ekspor');
        $berkas = $dasar.$akhiran;
        rename($dasar, $berkas);

        return $this->sementara[] = $berkas;
    }

    /** @param list<Row> $baris @return string isi sheet1.xml */
    private function tulisXlsx(array $baris, string $berkas): string
    {
        $w = new Writer;
        $w->openToFile($berkas);
        foreach ($baris as $b) {
            $w->addRow($b);
        }
        $w->close();

        $zip = new ZipArchive;
        $this->assertTrue($zip->open($berkas) === true, 'Berkas xlsx harus berupa zip yang valid.');
        $this->assertNotFalse($zip->locateName('[Content_Types].xml'));
        $xml = (string) $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        return $xml;
    }

    private function jumlahRumus(string $xml): int
    {
        return (int) preg_match_all('/<f[ >]/', $xml);
    }

    // ---- PDF -----------------------------------------------------------

    public function test_dompdf_menghasilkan_pdf_valid_dengan_karakter_indonesia(): void
    {
        $opsi = new Options;
        $opsi->set('isRemoteEnabled', false); // jangan mengambil sumber daya dari internet
        $opsi->set('isPhpEnabled', false);    // jangan menjalankan PHP di dalam HTML
        $opsi->set('defaultFont', 'DejaVu Sans');

        $pdf = new Dompdf($opsi);
        $judul = htmlspecialchars('<script>alert(1)</script> & "petik" é ü – Printer lantai 2');
        $pdf->loadHtml('<h2>Laporan Tiket</h2><table><tr><td>IS-2026-0001</td><td>'.$judul.'</td></tr></table>');
        $pdf->setPaper('A4', 'landscape');
        $pdf->render();

        $isi = $pdf->output();

        $this->assertStringStartsWith('%PDF-', $isi);
        $this->assertStringContainsString('%%EOF', substr($isi, -32));
        $this->assertGreaterThan(1000, strlen($isi));
    }

    public function test_dompdf_dengan_opsi_aman_tidak_mengambil_gambar_dari_internet(): void
    {
        $opsi = new Options;
        $opsi->set('isRemoteEnabled', false);
        $opsi->set('isPhpEnabled', false);

        $pdf = new Dompdf($opsi);
        // Alamat yang tidak mungkin dijangkau: bila pustaka mencoba mengambilnya, render akan lambat atau gagal.
        $pdf->loadHtml('<p>Tiket</p><img src="http://10.255.255.1/pelacak.png">');
        $mulai = microtime(true);
        $pdf->render();

        $this->assertLessThan(5.0, microtime(true) - $mulai, 'Render tidak boleh menunggu sumber daya jarak jauh.');
        $this->assertStringStartsWith('%PDF-', $pdf->output());
    }

    // ---- Excel ---------------------------------------------------------

    public function test_xlsx_valid_dan_dapat_dibaca_kembali_dengan_isi_utuh(): void
    {
        $berkas = $this->berkasSementara('.xlsx');
        $this->tulisXlsx([
            new Row([new StringCell('Nomor Tiket', null), new StringCell('Judul', null)]),
            new Row([new StringCell('IS-2026-0001', null), new StringCell('Printer rusak é ü – lantai 2', null)]),
        ], $berkas);

        $pembaca = new Reader;
        $pembaca->open($berkas);
        $isi = [];
        foreach ($pembaca->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $baris) {
                $isi[] = $baris->toArray();
            }
        }
        $pembaca->close();

        $this->assertSame([['Nomor Tiket', 'Judul'], ['IS-2026-0001', 'Printer rusak é ü – lantai 2']], $isi);
    }

    public function test_stringcell_menetralkan_rumus_pada_isian_pengguna(): void
    {
        $jahat = ['=HYPERLINK("http://jahat.example","klik")', '+cmd|calc', '@SUM(1+1)', '-2+3'];

        $xml = $this->tulisXlsx(
            [new Row(array_map(fn (string $v) => new StringCell($v, null), $jahat))],
            $this->berkasSementara('.xlsx'),
        );

        $this->assertSame(0, $this->jumlahRumus($xml), 'Tidak boleh ada sel rumus aktif.');
        $this->assertStringContainsString('HYPERLINK', $xml, 'Teksnya tetap tersimpan utuh sebagai teks.');
    }

    /**
     * Dokumentasi jebakan: JIKA tes ini suatu hari gagal, OpenSpout berubah perilaku dan aturan di atas bisa dilonggarkan.
     * Selama lulus, JANGAN membuat sel isian pengguna dengan Row::fromValues().
     */
    public function test_row_fromvalues_membuat_rumus_aktif_dari_teks_berawalan_sama_dengan(): void
    {
        $xml = $this->tulisXlsx(
            [Row::fromValues(['=HYPERLINK("http://jahat.example","klik")'])],
            $this->berkasSementara('.xlsx'),
        );

        $this->assertSame(1, $this->jumlahRumus($xml));
    }
}
