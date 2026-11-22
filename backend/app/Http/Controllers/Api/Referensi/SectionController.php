<?php

namespace App\Http\Controllers\Api\Referensi;

use App\Http\Controllers\Controller;
use App\Models\Bagian;
use Illuminate\Http\JsonResponse;

class SectionController extends Controller
{
    /**
     * GET /api/referensi/section — data referensi publik untuk dropdown Section
     * (form register). Read-only dan hanya section aktif; pengelolaan tetap di modul Admin.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Bagian::aktif()->orderBy('nama_bagian')->get(['id', 'kode_bagian', 'nama_bagian', 'deskripsi']),
        ]);
    }
}
