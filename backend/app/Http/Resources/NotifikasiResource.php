<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/**
 * Satu notifikasi dalam aplikasi. Isi diambil dari kolom data (lihat TiketDiperbarui::toArray).
 *
 * @mixin DatabaseNotification
 */
class NotifikasiResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'aksi' => $this->data['aksi'] ?? null,
            'judul' => $this->data['judul'] ?? '',
            'pesan' => $this->data['pesan'] ?? '',
            'id_permintaan' => $this->data['id_permintaan'] ?? null,
            'kode_tiket' => $this->data['kode_tiket'] ?? null,
            'dibaca' => $this->read_at !== null,
            'dibaca_pada' => $this->read_at?->toIso8601String(),
            'dibuat_pada' => $this->created_at?->toIso8601String(),
        ];
    }
}
