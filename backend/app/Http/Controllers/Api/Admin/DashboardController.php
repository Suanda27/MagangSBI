<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Resources\Pic\PicPermintaanResource;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard — kartu ringkasan master data, beban tiket per section, dan 5 tiket terbaru.
     * Tanpa target waktu (SLA): hanya jumlah.
     */
    public function index(): JsonResponse
    {
        $aktif = StatusAkun::Aktif->value;

        $hitungStatus = fn (string $model) => [
            'total' => $model::query()->count(),
            'aktif' => $model::query()->where('status', $aktif)->count(),
            'nonaktif' => $model::query()->where('status', '!=', $aktif)->count(),
        ];

        $pic = User::query()->where('role', Role::Pic->value);

        $bebanPerSection = Permintaan::query()
            ->selectRaw('id_bagian, count(*) as jumlah')
            ->groupBy('id_bagian')
            ->pluck('jumlah', 'id_bagian');

        $beban = Bagian::query()->orderBy('nama_bagian')->get()
            ->map(fn (Bagian $b) => [
                'id' => $b->id,
                'kode_bagian' => $b->kode_bagian,
                'nama_bagian' => $b->nama_bagian,
                'jumlah' => (int) ($bebanPerSection[$b->id] ?? 0),
            ])
            ->sortByDesc('jumlah')->values();

        $perStatus = Permintaan::query()
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $status = [];
        foreach (StatusPermintaan::cases() as $s) {
            $status[$s->value] = (int) ($perStatus[$s->value] ?? 0);
        }

        $terbaru = Permintaan::query()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian'])
            ->latest()->latest('id')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'pengguna' => $hitungStatus(User::class),
                'section' => $hitungStatus(Bagian::class),
                'layanan' => $hitungStatus(Layanan::class),
                'pic' => [
                    'total' => (clone $pic)->count(),
                    'aktif' => (clone $pic)->where('status', $aktif)->count(),
                    'nonaktif' => (clone $pic)->where('status', '!=', $aktif)->count(),
                ],
                'tiket' => ['total' => array_sum($status), 'per_status' => $status],
                'beban_section' => $beban,
                'tiket_terbaru' => PicPermintaanResource::collection($terbaru)->resolve(request()),
            ],
        ]);
    }
}
