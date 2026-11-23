<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Admin\MasterDataGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Kelola pengguna (PRD 6.5). Akun tidak dihapus, hanya dinonaktifkan lewat status. */
class UserController extends Controller
{
    public function __construct(private readonly MasterDataGuard $guard) {}

    /**
     * GET /api/admin/users?q=&role=&status=&id_bagian=&per_page=
     * Daftar bertahap (paginasi), urut nama.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(Role::class)],
            'status' => ['nullable', Rule::enum(StatusAkun::class)],
            'id_bagian' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $cari = isset($filter['q']) && $filter['q'] !== ''
            ? '%'.addcslashes($filter['q'], '%_\\').'%'
            : null;

        $pengguna = User::query()
            ->with('bagian')
            ->when($cari, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', $cari)
                ->orWhere('nik', 'like', $cari)
                ->orWhere('email', 'like', $cari)))
            ->when($filter['role'] ?? null, fn ($q, $role) => $q->where('role', $role))
            ->when($filter['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filter['id_bagian'] ?? null, fn ($q, $id) => $q->where('id_bagian', $id))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate((int) ($filter['per_page'] ?? 15))
            ->withQueryString();

        return UserResource::collection($pengguna);
    }

    /** GET /api/admin/users/{user} */
    public function show(User $user): UserResource
    {
        return new UserResource($user->load('bagian'));
    }

    /** POST /api/admin/users */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['status'] ??= StatusAkun::Aktif->value;

        $user = User::create($data);

        return response()->json([
            'message' => 'Pengguna berhasil dibuat.',
            'data' => new UserResource($user->load('bagian')),
        ], 201);
    }

    /**
     * PATCH /api/admin/users/{user}
     * 422: isian tidak valid atau mengunci akun sendiri. 409: PIC masih memegang tiket berjalan.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        // Admin tidak terikat ke section.
        if (($data['role'] ?? $user->role->value) === Role::Admin->value) {
            $data['id_bagian'] = null;
        }

        if ($user->isPic() && $this->melepasTugasPic($user, $data)) {
            $this->guard->pastikanPicTidakMemegangTiket($user);
        }

        $user->update($data);

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => new UserResource($user->load('bagian')),
        ]);
    }

    /**
     * PIC dianggap melepas tugas bila peran berubah, section berpindah, atau akun dinonaktifkan.
     *
     * @param  array<string, mixed>  $data
     */
    private function melepasTugasPic(User $pic, array $data): bool
    {
        $perubahanPeran = isset($data['role']) && $data['role'] !== Role::Pic->value;
        $pindahSection = array_key_exists('id_bagian', $data) && (int) $data['id_bagian'] !== (int) $pic->id_bagian;
        $dinonaktifkan = ($data['status'] ?? null) === StatusAkun::Nonaktif->value;

        return $perubahanPeran || $pindahSection || $dinonaktifkan;
    }
}
