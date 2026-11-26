<?php

namespace App\Services;

use App\Models\Permintaan;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Menyajikan daftar tiket sebagai berkas CSV yang aman dibuka di Excel. Dipakai Laporan Admin dan Laporan PIC,
 * sehingga kolom, format, dan perlindungannya sama di keduanya.
 */
class EksporTiketCsv
{
    /** Pemisah kolom: titik koma, supaya terbuka rapi di Excel dengan pengaturan regional Indonesia. */
    private const PEMISAH = ';';

    /**
     * @param  Builder<Permintaan>  $query  tiket yang akan diekspor (relasi dimuat di sini)
     * @param  string  $awalan  awalan nama berkas, mis. "laporan-tiket"
     */
    public function alirkan(Builder $query, string $awalan): StreamedResponse
    {
        $nama = $awalan.'-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $keluar = fopen('php://output', 'w');
            fwrite($keluar, "\xEF\xBB\xBF"); // BOM supaya Excel membaca UTF-8

            $tulis = fn (array $kolom) => fputcsv($keluar, array_map([$this, 'aman'], $kolom), self::PEMISAH);

            $tulis([
                'Nomor Tiket', 'Judul', 'Layanan', 'Kategori', 'Pengaju', 'NIK Pengaju', 'Section Tujuan', 'PIC',
                'Plant', 'Lantai', 'Prioritas', 'Status', 'Jumlah Revisi', 'Tanggal Ajuan', 'Tanggal Selesai', 'Tanggal Ditolak',
            ]);

            $query->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian'])
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
