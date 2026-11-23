<?php

namespace App\Http\Resources\Admin;

use App\Models\Layanan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Layanan untuk halaman Admin (semua status, termasuk nonaktif).
 *
 * @mixin Layanan
 */
class LayananResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode_layanan' => $this->kode_layanan,
            'nama_layanan' => $this->nama_layanan,
            'kategori' => $this->kategori,
            'deskripsi' => $this->deskripsi,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'bagian' => $this->whenLoaded('bagian', fn () => [
                'id' => $this->bagian->id,
                'kode_bagian' => $this->bagian->kode_bagian,
                'nama_bagian' => $this->bagian->nama_bagian,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
