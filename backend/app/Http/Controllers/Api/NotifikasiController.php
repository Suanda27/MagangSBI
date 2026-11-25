<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotifikasiResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class NotifikasiController extends Controller
{
    private const PER_PAGE_BAWAAN = 10;

    private const PER_PAGE_MAKS = 50;

    /**
     * GET /api/notifikasi?belum_dibaca=1&page=&per_page= — notifikasi MILIK SENDIRI, terbaru lebih dulu.
     * Respons juga membawa belum_dibaca (jumlah seluruh notifikasi yang belum dibaca) untuk lencana lonceng.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $data = $request->validate([
            'belum_dibaca' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAKS],
        ]);

        $akun = $request->user();

        $notifikasi = ($request->boolean('belum_dibaca') ? $akun->unreadNotifications() : $akun->notifications())
            ->latest()
            ->paginate((int) ($data['per_page'] ?? self::PER_PAGE_BAWAAN))
            ->withQueryString();

        return NotifikasiResource::collection($notifikasi)
            ->additional(['belum_dibaca' => $akun->unreadNotifications()->count()]);
    }

    /**
     * POST /api/notifikasi/baca — tandai dibaca. Kirim salah satu: { "semua": true } atau { "ids": [uuid, ...] }.
     * Hanya notifikasi milik sendiri yang berubah; id milik orang lain diabaikan (tidak dibocorkan).
     */
    public function baca(Request $request): JsonResponse
    {
        $data = $request->validate([
            'semua' => ['nullable', 'boolean'],
            'ids' => ['nullable', 'array', 'min:1', 'max:100'],
            'ids.*' => ['uuid'],
        ], [
            'ids.*.uuid' => 'Id notifikasi tidak valid.',
        ]);

        $semua = $request->boolean('semua');
        $ids = $data['ids'] ?? [];

        if ($semua === (count($ids) > 0)) {
            return response()->json([
                'message' => 'Kirim salah satu: semua=true atau daftar ids.',
                'errors' => ['ids' => ['Kirim salah satu: semua=true atau daftar ids.']],
            ], 422);
        }

        $akun = $request->user();
        $belumDibaca = $akun->unreadNotifications();

        $diubah = $semua
            ? $belumDibaca->update(['read_at' => now()])
            : $belumDibaca->whereIn('id', $ids)->update(['read_at' => now()]);

        return response()->json(['data' => [
            'diubah' => $diubah,
            'belum_dibaca' => $akun->unreadNotifications()->count(),
        ]]);
    }
}
