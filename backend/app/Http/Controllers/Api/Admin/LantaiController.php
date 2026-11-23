<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLantaiRequest;
use App\Http\Requests\Admin\UpdateLantaiRequest;
use App\Http\Resources\Admin\LantaiResource;
use App\Models\Lantai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Kelola lantai (PRD 6.5). Lantai tidak dihapus dan tidak dapat dipindah antar plant. */
class LantaiController extends Controller
{
    /** GET /api/admin/lantais?id_plant=&status=  — daftar datar, urut plant lalu nama lantai. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = $request->validate([
            'id_plant' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::enum(StatusAkun::class)],
        ]);

        $lantais = Lantai::query()
            ->with('plant')
            ->when($filter['id_plant'] ?? null, fn ($q, $id) => $q->where('id_plant', $id))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('id_plant')
            ->orderBy('nama_lantai')
            ->get();

        return LantaiResource::collection($lantais);
    }

    /** POST /api/admin/lantais */
    public function store(StoreLantaiRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] ??= StatusAkun::Aktif->value;

        $lantai = Lantai::create($data);

        return response()->json([
            'message' => 'Lantai berhasil dibuat.',
            'data' => new LantaiResource($lantai->load('plant')),
        ], 201);
    }

    /** PATCH /api/admin/lantais/{lantai} */
    public function update(UpdateLantaiRequest $request, Lantai $lantai): JsonResponse
    {
        $lantai->update($request->validated());

        return response()->json([
            'message' => 'Lantai berhasil diperbarui.',
            'data' => new LantaiResource($lantai->load('plant')),
        ]);
    }
}
