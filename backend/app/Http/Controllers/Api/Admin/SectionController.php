<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Http\Resources\Admin\SectionResource;
use App\Models\Bagian;
use App\Services\Admin\MasterDataGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Kelola section (PRD 6.5). Section tidak dihapus, hanya dinonaktifkan. */
class SectionController extends Controller
{
    public function __construct(private readonly MasterDataGuard $guard) {}

    /**
     * GET /api/admin/sections?q=&status=
     * Semua section (jumlahnya kecil, tanpa paginasi) beserta jumlah PIC aktif, pengguna, dan layanan.
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

        $section = Bagian::query()
            ->withCount(['pics', 'users', 'layanans'])
            ->when($cari, fn ($q) => $q->where(fn ($w) => $w
                ->where('kode_bagian', 'like', $cari)
                ->orWhere('nama_bagian', 'like', $cari)))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('kode_bagian')
            ->get();

        return SectionResource::collection($section);
    }

    /** POST /api/admin/sections */
    public function store(StoreSectionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] ??= StatusAkun::Aktif->value;

        $bagian = Bagian::create($data);

        return response()->json([
            'message' => 'Section berhasil dibuat.',
            'data' => new SectionResource($bagian->loadCount(['pics', 'users', 'layanans'])),
        ], 201);
    }

    /**
     * PATCH /api/admin/sections/{bagian}
     * 409 bila dinonaktifkan padahal masih ada tiket berjalan.
     */
    public function update(UpdateSectionRequest $request, Bagian $bagian): JsonResponse
    {
        $data = $request->validated();

        if (($data['status'] ?? null) === StatusAkun::Nonaktif->value && $bagian->status === StatusAkun::Aktif) {
            $this->guard->pastikanSectionTanpaTiketBerjalan($bagian);
        }

        $bagian->update($data);

        return response()->json([
            'message' => 'Section berhasil diperbarui.',
            'data' => new SectionResource($bagian->loadCount(['pics', 'users', 'layanans'])),
        ]);
    }
}
