<?php

namespace App\Http\Controllers\Api\Pic;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Models\Permintaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/pic/dashboard — hitungan untuk kartu ringkasan dan 5 tiket antrean teratas.
     *   antrean : tiket baru di section ini yang belum diambil siapa pun (dilihat semua PIC section).
     *   lainnya : tiket yang ditangani PIC ini sendiri, per status.
     */
    public function index(Request $request): JsonResponse
    {
        $pic = $request->user();

        $hitung = Permintaan::query()->ditanganiOleh($pic)
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $milikSaya = fn (StatusPermintaan $s) => (int) ($hitung[$s->value] ?? 0);

        $teratas = Permintaan::query()->antreanUntuk($pic)
            ->urutAntrean()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pengaju'])
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'antrean' => Permintaan::query()->antreanUntuk($pic)->count(),
                'sedang_diproses' => $milikSaya(StatusPermintaan::InProgress),
                'pending' => $milikSaya(StatusPermintaan::Pending),
                'menunggu_konfirmasi' => $milikSaya(StatusPermintaan::WaitingReview),
                'selesai' => $milikSaya(StatusPermintaan::Completed),
                'ditolak' => $milikSaya(StatusPermintaan::Rejected),
                'antrean_teratas' => PicPermintaanResource::collection($teratas)->resolve($request),
            ],
        ]);
    }
}
