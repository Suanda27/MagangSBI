<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\DaftarRiwayatRequest;
use App\Http\Resources\RiwayatKaryawanResource;
use App\Models\RiwayatPermintaan;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RiwayatController extends Controller
{
    /**
     * GET /api/employee/riwayat?status=&bulan=&q=&layanan=&page=&per_page= — log aktivitas
     * SEMUA tiket milik sendiri, terbaru lebih dulu. status = status tiket pada kejadian itu
     * (boleh lebih dari satu, dipisah koma); bulan = YYYY-MM; q mencari nomor tiket atau judul tiket.
     */
    public function index(DaftarRiwayatRequest $request): AnonymousResourceCollection
    {
        $karyawan = $request->user();
        $rentang = $request->rentangBulan();

        $kejadian = RiwayatPermintaan::query()
            ->whereHas('permintaan', function ($tiket) use ($karyawan, $request) {
                $tiket->milik($karyawan)
                    ->when($request->filled('layanan'), fn ($q) => $q->where('id_layanan', (int) $request->query('layanan')))
                    ->when($request->kataKunci() !== '', function ($q) use ($request) {
                        $kata = '%'.$request->kataKunci().'%';
                        $q->where(fn ($w) => $w->where('kode_tiket', 'like', $kata)->orWhere('judul', 'like', $kata));
                    });
            })
            ->when($request->statuses() !== [], fn ($q) => $q->whereIn('status', $request->statuses()))
            ->when($rentang !== null, fn ($q) => $q->whereBetween('created_at', $rentang))
            ->with(['permintaan:id,kode_tiket,judul,id_layanan', 'permintaan.layanan:id,nama_layanan', 'pelaku:id,name'])
            ->latest()->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return RiwayatKaryawanResource::collection($kejadian);
    }
}
