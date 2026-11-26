<?php

namespace App\Http\Controllers\Api\Supervisor;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Supervisor\EksporSupervisorRequest;
use App\Http\Requests\Supervisor\LaporanSupervisorRequest;
use App\Http\Resources\Supervisor\PermintaanSupervisorResource;
use App\Models\Layanan;
use App\Services\EksporTiket;
use App\Services\LaporanSupervisor;
use App\Services\LaporanTiket;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Laporan Supervisor: statistik dan rekap tiket SECTION sendiri (A1). Hanya baca. */
class LaporanController extends Controller
{
    public function __construct(
        private readonly LaporanSupervisor $laporan,
        private readonly LaporanTiket $dasar,
        private readonly EksporTiket $ekspor,
    ) {}

    /**
     * GET /api/supervisor/laporan?dari=&sampai=&status=&layanan=&page=&per_page=
     * Baris rekap berpaginasi (`data`, `meta`) dan `ringkasan` untuk SELURUH hasil filter (bukan hanya halaman ini):
     * total, per status, per layanan, per kategori, rata-rata durasi penyelesaian, rata-rata revisi, jumlah ditutup
     * otomatis, dan tren per periode. dari dan sampai mengacu pada tanggal pengajuan.
     */
    public function index(LaporanSupervisorRequest $request): AnonymousResourceCollection
    {
        $baris = $this->dasar->denganRelasi($this->laporan->query($request))
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return PermintaanSupervisorResource::collection($baris)->additional([
            'ringkasan' => $this->laporan->ringkasan($request),
        ]);
    }

    /**
     * GET /api/supervisor/laporan/ekspor?format=csv|excel|pdf&dari=&sampai=&status=&layanan=
     * Seluruh hasil filter (bukan satu halaman) sebagai berkas, dengan cakupan section yang sama seperti laporan.
     * PDF dibatasi jumlah barisnya (lihat EksporTiket::MAKS_BARIS_PDF) dan dijawab 422 bila terlampaui.
     */
    public function ekspor(EksporSupervisorRequest $request): StreamedResponse|Response
    {
        $format = (string) $request->query('format');
        $opsi = ['awalan' => 'laporan-tiket-'.Str::slug((string) $request->user()?->bagian?->kode_bagian)];

        if ($format === EksporTiket::FORMAT_PDF) {
            $opsi += [
                'judul' => 'Laporan Tiket Section '.($request->user()?->bagian?->nama_bagian ?? '-'),
                'keterangan' => $this->keterangan($request),
                'ringkasan' => $this->ringkasanPdf($this->laporan->ringkasan($request)),
            ];
        }

        return $this->ekspor->alirkan($this->laporan->query($request), $format, $opsi);
    }

    /** @return array<string,string> filter yang aktif, untuk kepala PDF */
    private function keterangan(EksporSupervisorRequest $request): array
    {
        $dari = $request->query('dari');
        $sampai = $request->query('sampai');
        $status = array_map(fn (string $s) => StatusPermintaan::from($s)->label(), $request->statuses());

        return array_filter([
            'Section' => $request->user()?->bagian?->nama_bagian ?? '-',
            'Periode' => ($dari || $sampai) ? ($dari ?: 'awal').' s/d '.($sampai ?: 'sekarang') : 'Semua tanggal',
            'Layanan' => $request->filled('layanan') ? (Layanan::query()->whereKey((int) $request->query('layanan'))->value('nama_layanan') ?? '-') : null,
            'Status' => $status === [] ? null : implode(', ', $status),
        ], fn ($v) => $v !== null);
    }

    /**
     * @param  array<string,mixed>  $r  hasil LaporanSupervisor::ringkasan()
     * @return array<string,string|int|float|null>
     */
    private function ringkasanPdf(array $r): array
    {
        $ringkas = ['Total tiket' => $r['total']];
        foreach (StatusPermintaan::cases() as $s) {
            $ringkas[$s->label()] = $r['per_status'][$s->value];
        }
        $ringkas['Rata-rata selesai (jam)'] = $r['selesai']['rata_rata_jam'];
        $ringkas['Rata-rata revisi'] = $r['rata_revisi'];

        return $ringkas;
    }
}
