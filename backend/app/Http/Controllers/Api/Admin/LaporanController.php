<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LaporanAdminRequest;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Models\Permintaan;
use App\Services\LaporanTiket;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Laporan Admin: statistik dan rekap tiket terfilter, plus ekspor CSV. Hanya baca. */
class LaporanController extends Controller
{
    /** Pemisah kolom CSV: titik koma, supaya terbuka rapi di Excel dengan pengaturan regional Indonesia. */
    private const PEMISAH = ';';

    public function __construct(private readonly LaporanTiket $laporan) {}

    /**
     * GET /api/admin/laporan — baris rekap berpaginasi (`data`, `meta`) dan `ringkasan` untuk SELURUH hasil filter
     * (bukan hanya halaman ini): total, per status, per section, layanan teratas, rata-rata waktu selesai.
     */
    public function index(LaporanAdminRequest $request): AnonymousResourceCollection
    {
        $baris = $this->laporan->denganRelasi($this->laporan->query($request))
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return PicPermintaanResource::collection($baris)->additional([
            'ringkasan' => $this->laporan->ringkasan($request),
        ]);
    }

    /** GET /api/admin/laporan/ekspor — seluruh hasil filter sebagai berkas CSV (UTF-8, dibuka langsung di Excel). */
    public function ekspor(LaporanAdminRequest $request): StreamedResponse
    {
        $nama = 'laporan-tiket-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($request) {
            $keluar = fopen('php://output', 'w');
            fwrite($keluar, "\xEF\xBB\xBF"); // BOM supaya Excel membaca UTF-8

            $tulis = fn (array $kolom) => fputcsv($keluar, array_map([$this, 'aman'], $kolom), self::PEMISAH);

            $tulis([
                'Nomor Tiket', 'Judul', 'Layanan', 'Kategori', 'Pengaju', 'NIK Pengaju', 'Section Tujuan', 'PIC',
                'Plant', 'Lantai', 'Prioritas', 'Status', 'Jumlah Revisi', 'Tanggal Ajuan', 'Tanggal Selesai', 'Tanggal Ditolak',
            ]);

            $this->laporan->denganRelasi($this->laporan->query($request))
                ->lazyByIdDesc(200)
                ->each(function (Permintaan $t) use ($tulis) {
                    $tulis([
                        $t->kode_tiket,
                        $t->judul,
                        $t->layanan?->nama_layanan,
                        $t->layanan?->kategori,
                        $t->pengaju?->name,
                        $t->pengaju?->nik,
                        $t->bagian?->nama_bagian,
                        $t->pic?->name ?? 'Belum diambil',
                        $t->plant?->nama_plant,
                        $t->lantai?->nama_lantai,
                        $t->prioritas->label(),
                        $t->status->label(),
                        $t->jumlah_revisi,
                        $t->created_at?->format('Y-m-d H:i'),
                        $t->selesai_pada?->format('Y-m-d H:i'),
                        $t->ditolak_pada?->format('Y-m-d H:i'),
                    ]);
                });

            fclose($keluar);
        }, $nama, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Cegah "CSV injection": judul atau nama yang diawali = + - @ (atau tab/CR) akan dijalankan Excel sebagai rumus.
     * Sel seperti itu diawali tanda petik supaya dibaca sebagai teks biasa.
     */
    private function aman(mixed $nilai): string
    {
        $teks = (string) ($nilai ?? '');

        return $teks !== '' && str_contains("=+-@\t\r", $teks[0]) ? "'".$teks : $teks;
    }
}
