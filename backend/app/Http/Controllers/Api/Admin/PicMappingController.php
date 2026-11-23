<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePicMappingRequest;
use App\Http\Requests\Admin\UpdatePicMappingRequest;
use App\Http\Resources\Admin\PicMappingResource;
use App\Models\User;
use App\Services\Admin\MasterDataGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Pemetaan PIC ke section (PRD D4: satu PIC = satu section, satu section boleh banyak PIC).
 * Menetapkan PIC mengubah role menjadi pic; DELETE mengembalikannya menjadi employee (akun tidak dihapus).
 */
class PicMappingController extends Controller
{
    public function __construct(private readonly MasterDataGuard $guard) {}

    /** GET /api/admin/pic-mapping?q=&id_bagian=&status=&per_page= — daftar PIC beserta section dan beban tiketnya. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'id_bagian' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::enum(StatusAkun::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $cari = isset($filter['q']) && $filter['q'] !== ''
            ? '%'.addcslashes($filter['q'], '%_\\').'%'
            : null;

        $pic = User::query()
            ->where('role', Role::Pic->value)
            ->with('bagian')
            ->withCount(['permintaanDitangani as tiket_aktif' => fn ($q) => $q->berjalan()])
            ->when($cari, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', $cari)
                ->orWhere('nik', 'like', $cari)
                ->orWhere('email', 'like', $cari)))
            ->when($filter['id_bagian'] ?? null, fn ($q, $id) => $q->where('id_bagian', $id))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->orderBy('id_bagian')
            ->orderBy('name')
            ->paginate((int) ($filter['per_page'] ?? 15))
            ->withQueryString();

        return PicMappingResource::collection($pic);
    }

    /** POST /api/admin/pic-mapping — body: user_id, id_bagian. */
    public function store(StorePicMappingRequest $request): JsonResponse
    {
        $user = User::findOrFail($request->integer('user_id'));
        $user->update(['role' => Role::Pic->value, 'id_bagian' => $request->integer('id_bagian')]);

        return response()->json([
            'message' => 'PIC berhasil ditetapkan.',
            'data' => new PicMappingResource($this->muat($user)),
        ], 201);
    }

    /** PATCH /api/admin/pic-mapping/{user} — body: id_bagian. 409 bila PIC masih memegang tiket berjalan. */
    public function update(UpdatePicMappingRequest $request, User $user): JsonResponse
    {
        $this->pastikanPic($user);

        $tujuan = $request->integer('id_bagian');
        if ($tujuan !== (int) $user->id_bagian) {
            $this->guard->pastikanPicTidakMemegangTiket($user);
            $user->update(['id_bagian' => $tujuan]);
        }

        return response()->json([
            'message' => 'Section PIC berhasil diperbarui.',
            'data' => new PicMappingResource($this->muat($user)),
        ]);
    }

    /**
     * DELETE /api/admin/pic-mapping/{user} — kembalikan ke karyawan (section tetap).
     * Akun tidak dihapus. 409 bila PIC masih memegang tiket berjalan.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->pastikanPic($user);
        $this->guard->pastikanPicTidakMemegangTiket($user);

        $user->update(['role' => Role::Employee->value]);

        return response()->json([
            'message' => 'PIC dikembalikan menjadi karyawan.',
            'data' => new PicMappingResource($this->muat($user)),
        ]);
    }

    private function pastikanPic(User $user): void
    {
        abort_unless($user->isPic(), 404, 'Pengguna ini bukan PIC.');
    }

    private function muat(User $user): User
    {
        return $user->load('bagian')->loadCount(['permintaanDitangani as tiket_aktif' => fn ($q) => $q->berjalan()]);
    }
}
