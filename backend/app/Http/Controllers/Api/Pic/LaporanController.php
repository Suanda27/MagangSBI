<?php

namespace App\Http\Controllers\Api\Pic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pic\LaporanPicRequest;
use App\Services\EksporTiketCsv;
use App\Services\LaporanPic;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Laporan pribadi PIC: statistik atas tiket yang ia tangani sendiri, plus ekspor CSV. Hanya baca. */
class LaporanController extends Controller
{
    public function __construct(
        private readonly LaporanPic $laporan,
        private readonly EksporTiketCsv $ekspor,
    ) {}

    /** GET /api/pic/laporan — ringkasan statistik (lihat LaporanPic::ringkasan). */
    public function index(LaporanPicRequest $request): JsonResponse
    {
        return response()->json(['data' => $this->laporan->ringkasan($request->user(), $request)]);
    }

    /** GET /api/pic/laporan/ekspor — tiket yang PIC ini tangani (sesuai filter) sebagai berkas CSV. */
    public function ekspor(LaporanPicRequest $request): StreamedResponse
    {
        return $this->ekspor->alirkan($this->laporan->query($request->user(), $request), 'laporan-pic');
    }
}
