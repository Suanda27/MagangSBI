<?php

namespace App\Http\Resources;

use App\Models\RiwayatPermintaan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu kejadian pada log aktivitas karyawan (lintas tiket miliknya).
 *
 * @mixin RiwayatPermintaan
 */
class RiwayatKaryawanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'aksi' => $this->aksi->value,
            'judul' => $this->aksi->judul(),
            'status' => $this->status->value,
            'status_label' => $this->status->labelKaryawan(),
            'pelaku' => $this->pelaku?->name ?? 'Sistem',
            'keterangan' => $this->keterangan,
            'waktu' => $this->created_at?->toIso8601String(),
            'tiket' => [
                'id' => $this->permintaan->id,
                'kode_tiket' => $this->permintaan->kode_tiket,
                'judul' => $this->permintaan->judul,
                'layanan' => $this->permintaan->layanan?->nama_layanan,
            ],
        ];
    }
}
