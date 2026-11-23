<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePlantRequest;
use App\Http\Requests\Admin\UpdatePlantRequest;
use App\Http\Resources\Admin\PlantResource;
use App\Models\Plant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Kelola plant (PRD 6.5). Plant tidak dihapus, hanya dinonaktifkan.
 * Menonaktifkan plant tidak mengubah tiket berjalan: tiket tetap menyimpan lokasinya.
 */
class PlantController extends Controller
{
    /**
     * GET /api/admin/plants?q=&status=
     * Semua plant beserta lantainya (semua status), cocok untuk halaman Lokasi.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(StatusAkun::class)],
        ]);

        $cari = isset($filter['q']) && $filter['q'] !== ''
            ? '%'.addcslashes($filter['q'], '%_\\').'%'
            : null;

        $plants = Plant::query()
            ->with(['lantais' => fn ($q) => $q->orderBy('nama_lantai')])
            ->withCount('lantais')
            ->when($cari, fn ($q) => $q->where('nama_plant', 'like', $cari))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('nama_plant')
            ->get();

        return PlantResource::collection($plants);
    }

    /** POST /api/admin/plants */
    public function store(StorePlantRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] ??= StatusAkun::Aktif->value;

        $plant = Plant::create($data);

        return response()->json([
            'message' => 'Plant berhasil dibuat.',
            'data' => new PlantResource($plant->load('lantais')->loadCount('lantais')),
        ], 201);
    }

    /** PATCH /api/admin/plants/{plant} */
    public function update(UpdatePlantRequest $request, Plant $plant): JsonResponse
    {
        $plant->update($request->validated());

        return response()->json([
            'message' => 'Plant berhasil diperbarui.',
            'data' => new PlantResource($plant->load(['lantais' => fn ($q) => $q->orderBy('nama_lantai')])->loadCount('lantais')),
        ]);
    }
}
