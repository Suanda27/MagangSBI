<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DaftarPermintaanAdminRequest;
use App\Http\Resources\Pic\PicPermintaanDetailResource;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Models\Permintaan;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** Pantauan semua tiket lintas section untuk Admin. Hanya baca: perubahan status tetap milik PIC dan karyawan. */
class PermintaanController extends Controller
{
    /**
     * GET /api/admin/permintaan — semua tiket, terbaru lebih dulu. Selain `data` dan `meta`, respons memuat
     * `ringkasan`: jumlah tiket per status di seluruh sistem (tidak terpengaruh filter), untuk kartu di atas tabel.
     */
    public function index(DaftarPermintaanAdminRequest $request): AnonymousResourceCollection
    {
        $tiket = Permintaan::query()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian'])
            ->when($request->statuses() !== [], fn ($q) => $q->whereIn('status', $request->statuses()))
            ->when($request->filled('id_bagian'), fn ($q) => $q->where('id_bagian', (int) $request->query('id_bagian')))
            ->when($request->filled('id_plant'), fn ($q) => $q->where('id_plant', (int) $request->query('id_plant')))
            ->when($request->kataKunci() !== '', function ($q) use ($request) {
                $kata = '%'.addcslashes($request->kataKunci(), '%_\\').'%';
                $q->where(fn ($w) => $w
                    ->where('kode_tiket', 'like', $kata)
                    ->orWhere('judul', 'like', $kata)
                    ->orWhereHas('pengaju', fn ($p) => $p->where('name', 'like', $kata)->orWhere('nik', 'like', $kata)));
            })
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        $hitung = Permintaan::query()
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $perStatus = [];
        foreach (StatusPermintaan::cases() as $status) {
            $perStatus[$status->value] = (int) ($hitung[$status->value] ?? 0);
        }

        return PicPermintaanResource::collection($tiket)->additional([
            'ringkasan' => ['total' => array_sum($perStatus), 'per_status' => $perStatus],
        ]);
    }

    /** GET /api/admin/permintaan/{id} — detail lengkap (pengaju, PIC, lampiran, hasil kerja, riwayat). */
    public function show(int $id): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        Gate::authorize('view', $tiket);

        return new PicPermintaanDetailResource($tiket);
    }
}
