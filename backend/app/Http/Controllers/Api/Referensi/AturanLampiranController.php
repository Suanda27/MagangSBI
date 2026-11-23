<?php

namespace App\Http\Controllers\Api\Referensi;

use App\Http\Controllers\Controller;
use App\Models\Pengaturan;
use Illuminate\Http\JsonResponse;

class AturanLampiranController extends Controller
{
    /** Batas jumlah berkas per tiket (PRD). */
    public const MAKS_BERKAS = 5;

    /** GET /api/referensi/aturan-lampiran — aturan unggah dari tabel pengaturans, agar form selalu sama dengan server. */
    public function index(): JsonResponse
    {
        $format = array_values(array_filter(array_map(
            'trim',
            explode(',', strtolower(Pengaturan::ambil('format_lampiran', 'jpg,png,pdf')))
        )));

        return response()->json(['data' => [
            'maks_berkas' => self::MAKS_BERKAS,
            'maks_ukuran_mb' => (int) Pengaturan::ambil('max_upload_mb', '5'),
            'format' => $format,
        ]]);
    }
}
