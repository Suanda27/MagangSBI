<?php

namespace App\Http\Resources;

use App\Models\Permintaan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Tiket untuk karyawan pengaju. Hanya relasi yang sudah dimuat yang ikut dikirim.
 *
 * @mixin Permintaan
 */
class PermintaanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode_tiket' => $this->kode_tiket,
            'judul' => $this->judul,
            'deskripsi' => $this->deskripsi,
            'status' => $this->status->value,
            'status_label' => $this->status->labelKaryawan(),
            'prioritas' => $this->prioritas->value,
            'prioritas_label' => $this->prioritas->label(),
            'layanan' => $this->whenLoaded('layanan', fn () => [
                'id' => $this->layanan->id,
                'nama_layanan' => $this->layanan->nama_layanan,
                'kategori' => $this->layanan->kategori,
            ]),
            'bagian' => $this->whenLoaded('bagian', fn () => [
                'id' => $this->bagian->id,
                'kode_bagian' => $this->bagian->kode_bagian,
                'nama_bagian' => $this->bagian->nama_bagian,
            ]),
            'lokasi' => [
                'plant' => $this->whenLoaded('plant', fn () => $this->plant->nama_plant),
                'lantai' => $this->whenLoaded('lantai', fn () => $this->lantai->nama_lantai),
                'detail' => $this->lokasi_detail,
            ],
            'lampiran' => $this->whenLoaded('lampirans', fn () => $this->lampirans->map(fn ($l) => [
                'id' => $l->id,
                'nama_file' => $l->nama_file,
                'tipe_file' => $l->tipe_file,
                'ukuran_file' => $l->ukuran_file,
                'url' => url('/api/lampiran/'.$l->id),
            ])->values()),
            'dibuat_pada' => $this->created_at?->toIso8601String(),
        ];
    }
}
