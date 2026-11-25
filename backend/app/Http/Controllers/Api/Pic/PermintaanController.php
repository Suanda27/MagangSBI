<?php

namespace App\Http\Controllers\Api\Pic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pic\DaftarPermintaanPicRequest;
use App\Http\Resources\Pic\PicPermintaanDetailResource;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Models\Permintaan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class PermintaanController extends Controller
{
    /**
     * GET /api/pic/permintaan?tab=masuk|diproses|selesai — daftar tiket menurut tab:
     *   masuk    → antrean section PIC (baru, belum diambil siapa pun), urut prioritas lalu terlama.
     *   diproses → tiket yang DITANGANI PIC ini dan belum final (Diproses, Pending, Menunggu Konfirmasi).
     *   selesai  → tiket yang ditangani PIC ini dan sudah final (Selesai, Ditolak).
     */
    public function index(DaftarPermintaanPicRequest $request): AnonymousResourceCollection
    {
        $pic = $request->user();

        $tiket = Permintaan::query()
            ->when(
                $request->tab() === DaftarPermintaanPicRequest::TAB_MASUK,
                fn ($q) => $q->antreanUntuk($pic)->urutAntrean(),
                fn ($q) => $q->ditanganiOleh($pic)->latest('updated_at')->latest('id'),
            )
            ->whereIn('status', $request->statusEfektif())
            ->when($request->filled('prioritas'), fn ($q) => $q->where('prioritas', $request->query('prioritas')))
            ->when($request->filled('layanan'), fn ($q) => $q->where('id_layanan', (int) $request->query('layanan')))
            ->when($request->kataKunci() !== '', function ($q) use ($request) {
                $kata = '%'.$request->kataKunci().'%';
                $q->where(fn ($w) => $w->where('kode_tiket', 'like', $kata)->orWhere('judul', 'like', $kata));
            })
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pengaju.bagian'])
            ->paginate($request->perPage())
            ->withQueryString();

        return PicPermintaanResource::collection($tiket);
    }

    /**
     * GET /api/pic/permintaan/{id} — detail tiket. Boleh dibuka bila tiket baru di section PIC ini
     * atau tiket yang ia tangani (PermintaanPolicy::view); selain itu 403.
     */
    public function show(Request $request, int $id): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        Gate::authorize('view', $tiket);

        return new PicPermintaanDetailResource($tiket);
    }
}
