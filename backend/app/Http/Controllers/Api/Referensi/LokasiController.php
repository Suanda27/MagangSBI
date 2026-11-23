<?php

namespace App\Http\Controllers\Api\Referensi;

use App\Http\Controllers\Controller;
use App\Models\Plant;
use Illuminate\Http\JsonResponse;

class LokasiController extends Controller
{
    /** GET /api/referensi/lokasi — plant beserta lantainya (dropdown bertingkat). Hanya yang aktif. */
    public function index(): JsonResponse
    {
        $plants = Plant::query()
            ->aktif()
            ->with(['lantais' => fn ($q) => $q->aktif()->orderBy('nama_lantai')->select(['id', 'nama_lantai', 'id_plant'])])
            ->orderBy('nama_plant')
            ->get(['id', 'nama_plant']);

        return response()->json(['data' => $plants]);
    }
}
