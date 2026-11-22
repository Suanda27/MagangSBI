<?php

namespace App\Http\Controllers\Api\Referensi;

use App\Http\Controllers\Controller;
use App\Models\Layanan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LayananController extends Controller
{
    /**
     * GET /api/referensi/layanan?bagian={id} — layanan aktif milik satu section,
     * dikelompokkan per kategori (PRD 6.2). Hanya untuk pengguna login.
     */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bagian' => ['required', 'integer', 'exists:bagians,id'],
        ], [
            'bagian.required' => 'Section tujuan wajib dipilih.',
            'bagian.integer' => 'Section tidak valid.',
            'bagian.exists' => 'Section tidak ditemukan.',
        ]);

        $kategori = Layanan::aktif()
            ->where('id_bagian', $data['bagian'])
            ->orderBy('kategori')
            ->orderBy('nama_layanan')
            ->get(['id', 'kode_layanan', 'nama_layanan', 'kategori', 'deskripsi'])
            ->groupBy('kategori')
            ->map(fn ($items, $nama) => ['kategori' => $nama, 'layanan' => $items->values()])
            ->values();

        return response()->json(['data' => $kategori]);
    }
}
