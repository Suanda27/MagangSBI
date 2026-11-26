<?php

namespace App\Http\Controllers\Api\Supervisor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supervisor\DaftarPermintaanSupervisorRequest;
use App\Http\Resources\Supervisor\PermintaanSupervisorDetailResource;
use App\Http\Resources\Supervisor\PermintaanSupervisorResource;
use App\Models\Permintaan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class PermintaanController extends Controller
{
    /**
     * GET /api/supervisor/permintaan?status=&layanan=&dari=&sampai=&q=&page=&per_page=
     * Hanya tiket yang ditujukan ke SECTION supervisor (aturan A1), terbaru lebih dulu. Semua status
     * ikut tampil, termasuk yang masih menunggu PIC. dari dan sampai mengacu pada tanggal pengajuan.
     * q mencari nomor tiket, judul, atau nama pengaju.
     */
    public function index(DaftarPermintaanSupervisorRequest $request): AnonymousResourceCollection
    {
        // id_bagian 0 tidak cocok dengan section mana pun: akun tanpa section melihat daftar kosong.
        $idBagian = (int) $request->user()->id_bagian;
        $dari = $request->dari();
        $sampai = $request->sampai();

        $tiket = Permintaan::query()
            ->untukSection($idBagian)
            ->with(['layanan', 'pengaju:id,name', 'pic:id,name', 'plant', 'lantai'])
            ->when($request->statuses() !== [], fn ($q) => $q->whereIn('status', $request->statuses()))
            ->when($request->filled('layanan'), fn ($q) => $q->where('id_layanan', (int) $request->query('layanan')))
            ->when($dari !== null, fn ($q) => $q->where('created_at', '>=', $dari))
            ->when($sampai !== null, fn ($q) => $q->where('created_at', '<=', $sampai))
            ->when($request->kataKunci() !== '', function ($q) use ($request) {
                $kata = '%'.$request->kataKunci().'%';
                $q->where(fn ($w) => $w
                    ->where('kode_tiket', 'like', $kata)
                    ->orWhere('judul', 'like', $kata)
                    ->orWhereHas('pengaju', fn ($p) => $p->where('name', 'like', $kata)));
            })
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return PermintaanSupervisorResource::collection($tiket);
    }

    /**
     * GET /api/supervisor/permintaan/{id} — detail read-only. Tiket section lain atau yang tidak ada
     * dijawab 404 (keberadaannya tidak dibocorkan).
     */
    public function show(Request $request, int $id): PermintaanSupervisorDetailResource
    {
        $tiket = Permintaan::query()
            ->untukSection((int) $request->user()->id_bagian)
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        Gate::authorize('view', $tiket);

        return new PermintaanSupervisorDetailResource($tiket);
    }
}
