<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Referensi\AturanLampiranController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePengaturanRequest;
use App\Models\Pengaturan;
use Illuminate\Http\JsonResponse;

/**
 * Pengaturan sistem (PRD D11): hanya batas ukuran dan format lampiran yang dapat diubah.
 * Nilai disimpan di tabel pengaturans dan dibaca juga oleh GET /api/referensi/aturan-lampiran
 * serta layanan unggah berkas, sehingga form dan server selalu memakai aturan yang sama.
 */
class PengaturanController extends Controller
{
    /** GET /api/admin/pengaturan */
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->data()]);
    }

    /** PATCH /api/admin/pengaturan — kirim hanya kunci yang diubah. */
    public function update(UpdatePengaturanRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('max_upload_mb', $data)) {
            Pengaturan::simpan('max_upload_mb', (int) $data['max_upload_mb']);
        }

        if (array_key_exists('format_lampiran', $data)) {
            // Urutan tetap (jpg, png, pdf) agar nilai tersimpan konsisten.
            $dipilih = array_values(array_intersect(UpdatePengaturanRequest::FORMAT_DIIZINKAN, $data['format_lampiran']));
            Pengaturan::simpan('format_lampiran', implode(',', $dipilih));
        }

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan.',
            'data' => $this->data(),
        ]);
    }

    /** @return array<string, mixed> */
    private function data(): array
    {
        return [
            'max_upload_mb' => (int) Pengaturan::ambil('max_upload_mb', '5'),
            'format_lampiran' => array_values(array_filter(array_map(
                'trim',
                explode(',', strtolower(Pengaturan::ambil('format_lampiran', 'jpg,png,pdf')))
            ))),
            // Hanya dibaca (tidak dapat diubah dari sini).
            'digit_nomor_tiket' => (int) Pengaturan::ambil('digit_nomor_tiket', '4'),
            'maks_berkas' => AturanLampiranController::MAKS_BERKAS,
        ];
    }
}
