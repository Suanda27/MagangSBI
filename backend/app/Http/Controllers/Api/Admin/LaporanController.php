<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LaporanAdminRequest;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Services\EksporTiketCsv;
use App\Services\LaporanTiket;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Laporan Admin: statistik dan rekap tiket terfilter, plus ekspor CSV. Hanya baca. */
class LaporanController extends Controller
{
    public function __construct(
        private readonly LaporanTiket $laporan,
        private readonly EksporTiketCsv $ekspor,
    ) {}

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
        return $this->ekspor->alirkan($this->laporan->query($request), 'laporan-tiket');
    }
}
