<?php

namespace App\Http\Resources\Supervisor;

use App\Models\Permintaan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Satu baris daftar monitoring supervisor. Muat relasi layanan, pengaju, pic, plant, lantai.
 * Label status memakai sudut pandang umum (mis. "Menunggu Pemeriksaan"), bukan sudut pandang karyawan.
 *
 * @mixin Permintaan
 */
class PermintaanSupervisorResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode_tiket' => $this->kode_tiket,
            'judul' => $this->judul,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'prioritas' => $this->prioritas->value,
            'prioritas_label' => $this->prioritas->label(),
            'layanan' => $this->whenLoaded('layanan', fn () => [
                'id' => $this->layanan->id,
                'nama_layanan' => $this->layanan->nama_layanan,
                'kategori' => $this->layanan->kategori,
            ]),
            'pengaju' => $this->whenLoaded('pengaju', fn () => $this->pengaju?->name),
            'pic' => $this->whenLoaded('pic', fn () => $this->pic?->name),
            'lokasi' => [
                'plant' => $this->whenLoaded('plant', fn () => $this->plant?->nama_plant),
                'lantai' => $this->whenLoaded('lantai', fn () => $this->lantai?->nama_lantai),
            ],
            'dibuat_pada' => $this->created_at?->toIso8601String(),
        ];
    }
}
