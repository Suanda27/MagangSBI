<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\DaftarPermintaanRequest;
use App\Http\Requests\Employee\StorePermintaanRequest;
use App\Http\Resources\PermintaanDetailResource;
use App\Http\Resources\PermintaanResource;
use App\Models\Permintaan;
use App\Services\TicketCreator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class PermintaanController extends Controller
{
    /**
     * GET /api/employee/permintaan?status=&q=&layanan=&page=&per_page= — tiket MILIK SENDIRI,
     * terbaru lebih dulu. status boleh lebih dari satu (dipisah koma); q mencari nomor tiket atau judul.
     */
    public function index(DaftarPermintaanRequest $request): AnonymousResourceCollection
    {
        $tiket = Permintaan::query()
            ->milik($request->user())
            ->with(['layanan', 'bagian', 'plant', 'lantai'])
            ->when($request->statuses() !== [], fn ($q) => $q->whereIn('status', $request->statuses()))
            ->when($request->filled('layanan'), fn ($q) => $q->where('id_layanan', (int) $request->query('layanan')))
            ->when($request->kataKunci() !== '', function ($q) use ($request) {
                $kata = '%'.$request->kataKunci().'%';
                $q->where(fn ($w) => $w->where('kode_tiket', 'like', $kata)->orWhere('judul', 'like', $kata));
            })
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return PermintaanResource::collection($tiket);
    }

    /**
     * GET /api/employee/permintaan/{id} — detail tiket sendiri beserta riwayat, lampiran, dan hasil kerja PIC.
     * Tiket milik orang lain dijawab 404 (keberadaannya tidak dibocorkan).
     */
    public function show(Request $request, int $id): PermintaanDetailResource
    {
        $tiket = Permintaan::query()
            ->milik($request->user())
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        Gate::authorize('view', $tiket);

        return new PermintaanDetailResource($tiket);
    }

    /**
     * POST /api/employee/permintaan (multipart) — ajukan tiket baru.
     * Nomor tiket, section tujuan, dan status ditentukan server (karyawan tidak bisa mengisinya).
     */
    public function store(StorePermintaanRequest $request, TicketCreator $pembuat): JsonResponse
    {
        $tiket = $pembuat->buat(
            $request->user(),
            $request->safe()->except('lampiran'),
            $request->file('lampiran', []),
        );

        return (new PermintaanResource($tiket))
            ->response()
            ->setStatusCode(201);
    }
}
