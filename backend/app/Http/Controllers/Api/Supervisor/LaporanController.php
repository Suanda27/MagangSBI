<?php

namespace App\Http\Controllers\Api\Supervisor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supervisor\LaporanSupervisorRequest;
use App\Http\Resources\Supervisor\PermintaanSupervisorResource;
use App\Services\LaporanSupervisor;
use App\Services\LaporanTiket;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Laporan Supervisor: statistik dan rekap tiket SECTION sendiri (A1). Hanya baca. */
class LaporanController extends Controller
{
    public function __construct(
        private readonly LaporanSupervisor $laporan,
        private readonly LaporanTiket $dasar,
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
}
