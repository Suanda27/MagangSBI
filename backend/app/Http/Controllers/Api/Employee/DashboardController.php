<?php

namespace App\Http\Controllers\Api\Employee;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Resources\PermintaanResource;
use App\Models\Permintaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** GET /api/employee/dashboard — jumlah tiket sendiri per status dan 5 tiket terbaru. */
    public function index(Request $request): JsonResponse
    {
        $karyawan = $request->user();

        $hitung = Permintaan::query()->milik($karyawan)
            ->selectRaw('status, count(*) as jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $perStatus = [];
        foreach (StatusPermintaan::cases() as $status) {
            $perStatus[$status->value] = (int) ($hitung[$status->value] ?? 0);
        }

        $terbaru = Permintaan::query()->milik($karyawan)
            ->with(['layanan', 'bagian'])
            ->latest()->latest('id')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'total' => array_sum($perStatus),
                'berjalan' => array_sum(array_intersect_key($perStatus, array_flip(StatusPermintaan::aktif()))),
                'per_status' => $perStatus,
                'terbaru' => PermintaanResource::collection($terbaru)->resolve($request),
            ],
        ]);
    }
}
