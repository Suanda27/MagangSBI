<?php

namespace App\Services;

use App\Models\Permintaan;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Cell\StringCell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan daftar tiket sebagai berkas CSV, Excel (xlsx), atau PDF dari satu kueri terfilter, sehingga isi
 * berkas selalu sama dengan angka di layar laporan. Aturan keamanan mengikuti docs/ekspor.md:
 *  - CSV: lewat EksporTiketCsv (Faiz) apa adanya.
 *  - Excel: seluruh teks pengguna dibungkus StringCell, tidak pernah Row::fromValues() (rumus aktif).
 *  - PDF: sumber daya luar dan PHP dimatikan, font DejaVu Sans, teks lewat Blade (di-escape).
 * CSV dan Excel ditulis berangsur-angsur (aliran), sedangkan PDF dibuat utuh di memori sehingga jumlah barisnya dibatasi.
 */
class EksporTiket
{
    public const FORMAT_CSV = 'csv';

    public const FORMAT_EXCEL = 'excel';

    public const FORMAT_PDF = 'pdf';

    /** Format yang dikenal, sama dengan nilai ?format= di endpoint. */
    public const FORMAT = [self::FORMAT_CSV, self::FORMAT_EXCEL, self::FORMAT_PDF];

    /** PDF dibuat utuh di memori; di atas batas ini pengguna diminta mempersempit filter atau memakai CSV/Excel. */
    public const MAKS_BARIS_PDF = 100;

    private const TIPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    public function __construct(private readonly EksporTiketCsv $csv) {}

    /**
     * @param  Builder<Permintaan>  $query  tiket yang diekspor (relasi dimuat di sini)
     * @param  array{awalan?:string, judul?:string, keterangan?:array<string,string>, ringkasan?:array<string,string|int|float|null>}  $opsi
     *                                                                                                                                        awalan: awalan nama berkas; judul, keterangan (filter aktif), dan ringkasan hanya dipakai di PDF
     */
    public function alirkan(Builder $query, string $format, array $opsi = []): StreamedResponse|Response
    {
        $awalan = $opsi['awalan'] ?? 'laporan-tiket';

        return match ($format) {
            self::FORMAT_CSV => $this->csv->alirkan($query, $awalan),
            self::FORMAT_EXCEL => $this->excel($query, $awalan),
            self::FORMAT_PDF => $this->pdf($query, $awalan, $opsi),
            default => throw ValidationException::withMessages(['format' => 'Format ekspor harus csv, excel, atau pdf.']),
        };
    }

    /** @return list<string> */
    public static function kolom(): array
    {
        return [
            'Nomor Tiket', 'Judul', 'Layanan', 'Kategori', 'Pengaju', 'NIK Pengaju', 'Section Tujuan', 'PIC',
            'Plant', 'Lantai', 'Prioritas', 'Status', 'Jumlah Revisi', 'Tanggal Ajuan', 'Tanggal Selesai', 'Tanggal Ditolak',
        ];
    }

    /** @return list<string> isian teks satu tiket, urutannya sama dengan kolom() */
    private function teks(Permintaan $t): array
    {
        return [
            (string) $t->kode_tiket,
            (string) $t->judul,
            (string) $t->layanan?->nama_layanan,
            (string) $t->layanan?->kategori,
            (string) $t->pengaju?->name,
            (string) $t->pengaju?->nik,
            (string) $t->bagian?->nama_bagian,
            $t->pic?->name ?? 'Belum diambil',
            (string) $t->plant?->nama_plant,
            (string) $t->lantai?->nama_lantai,
            $t->prioritas->label(),
            $t->status->label(),
            // jumlah revisi disisipkan sebagai angka di excel(); di PDF tampil sebagai teks
            (string) $t->jumlah_revisi,
            (string) $t->created_at?->format('Y-m-d H:i'),
            (string) $t->selesai_pada?->format('Y-m-d H:i'),
            (string) $t->ditolak_pada?->format('Y-m-d H:i'),
        ];
    }

    /** @param Builder<Permintaan> $query */
    private function denganRelasi(Builder $query): Builder
    {
        return $query->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian']);
    }

    // ---- Excel ---------------------------------------------------------

    /** @param Builder<Permintaan> $query */
    private function excel(Builder $query, string $awalan): StreamedResponse
    {
        $nama = $awalan.'-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($query) {
            $w = new Writer;
            $w->openToFile('php://output');
            $w->getCurrentSheet()->setName('Tiket');

            $tebal = new Style(fontBold: true);
            $w->addRow(new Row(array_map(fn (string $k) => new StringCell($k, $tebal), self::kolom())));

            $this->denganRelasi($query)->lazyByIdDesc(200)->each(function (Permintaan $t) use ($w) {
                $sel = array_map(fn (string $v) => new StringCell($v, null), $this->teks($t));
                $sel[12] = Cell::fromValue((int) $t->jumlah_revisi); // angka murni, bukan isian pengguna
                $w->addRow(new Row($sel));
            });

            $w->close();
        }, $nama, ['Content-Type' => self::TIPE_XLSX]);
    }

    // ---- PDF -----------------------------------------------------------

    /** Kolom yang muat di A4 lanjang: indeks pada kolom(). */
    private const KOLOM_PDF = [0, 1, 2, 4, 7, 10, 11, 12, 13, 14];

    /**
     * @param  Builder<Permintaan>  $query
     * @param  array<string,mixed>  $opsi
     */
    private function pdf(Builder $query, string $awalan, array $opsi): Response
    {
        $jumlah = (clone $query)->count();
        if ($jumlah > self::MAKS_BARIS_PDF) {
            throw ValidationException::withMessages([
                'format' => 'Hasil filter berisi '.$jumlah.' tiket, terlalu banyak untuk PDF (maksimal '.self::MAKS_BARIS_PDF
                    .'). Persempit rentang tanggal atau filternya, atau unduh sebagai CSV atau Excel.',
            ]);
        }

        $baris = $this->denganRelasi($query)->latest()->latest('id')->get()
            ->map(fn (Permintaan $t) => array_map(fn (int $i) => $this->teks($t)[$i], self::KOLOM_PDF));

        $html = view('ekspor.laporan-tiket', [
            'judul' => $opsi['judul'] ?? 'Laporan Tiket',
            'keterangan' => $opsi['keterangan'] ?? [],
            'ringkasan' => $opsi['ringkasan'] ?? [],
            'kolom' => array_map(fn (int $i) => self::kolom()[$i], self::KOLOM_PDF),
            'baris' => $baris,
            'dibuat' => now()->format('d-m-Y H:i'),
        ])->render();

        $opsiPdf = new Options;
        $opsiPdf->set('isRemoteEnabled', false); // tidak mengambil gambar atau CSS dari internet
        $opsiPdf->set('isPhpEnabled', false);    // tidak menjalankan PHP di dalam HTML
        $opsiPdf->set('defaultFont', 'DejaVu Sans'); // mendukung karakter Indonesia

        $pdf = new Dompdf($opsiPdf);
        $pdf->loadHtml($html);
        $pdf->setPaper('A4', 'landscape');
        $pdf->render();

        $nama = $awalan.'-'.now()->format('Ymd-His').'.pdf';

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$nama.'"',
        ]);
    }
}
