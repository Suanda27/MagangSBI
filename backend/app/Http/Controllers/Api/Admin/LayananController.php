<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLayananRequest;
use App\Http\Requests\Admin\UpdateLayananRequest;
use App\Http\Resources\Admin\LayananResource;
use App\Models\Layanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Kelola katalog layanan (PRD 6.5). Layanan tidak dihapus, hanya dinonaktifkan. */
class LayananController extends Controller
{
    /**
     * GET /api/admin/layanan?q=&id_bagian=&kategori=&status=&per_page=
     * Berbeda dari /api/referensi/layanan: di sini semua status tampil, termasuk nonaktif.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'id_bagian' => ['nullable', 'integer'],
            'kategori' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(StatusAkun::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $cari = isset($filter['q']) && $filter['q'] !== ''
            ? '%'.addcslashes($filter['q'], '%_\\').'%'
            : null;

        $layanan = Layanan::query()
            ->with('bagian')
            ->when($cari, fn ($q) => $q->where(fn ($w) => $w
                ->where('kode_layanan', 'like', $cari)
                ->orWhere('nama_layanan', 'like', $cari)))
            ->when($filter['id_bagian'] ?? null, fn ($q, $id) => $q->where('id_bagian', $id))
            ->when($filter['kategori'] ?? null, fn ($q, $kategori) => $q->where('kategori', $kategori))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('id_bagian')
            ->orderBy('kategori')
            ->orderBy('nama_layanan')
            ->paginate((int) ($filter['per_page'] ?? 15))
            ->withQueryString();

        return LayananResource::collection($layanan);
    }

    /** POST /api/admin/layanan */
    public function store(StoreLayananRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] ??= StatusAkun::Aktif->value;

        $layanan = Layanan::create($data);

        return response()->json([
            'message' => 'Layanan berhasil dibuat.',
            'data' => new LayananResource($layanan->load('bagian')),
        ], 201);
    }

    /** PATCH /api/admin/layanan/{layanan} */
    public function update(UpdateLayananRequest $request, Layanan $layanan): JsonResponse
    {
        $layanan->update($request->validated());

        return response()->json([
            'message' => 'Layanan berhasil diperbarui.',
            'data' => new LayananResource($layanan->load('bagian')),
        ]);
    }
}
