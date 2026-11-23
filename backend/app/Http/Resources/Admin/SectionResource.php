<?php

namespace App\Http\Resources\Admin;

use App\Models\Bagian;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Section untuk halaman Admin. Hitungan ikut dikirim bila dimuat dengan withCount.
 *
 * @mixin Bagian
 */
class SectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode_bagian' => $this->kode_bagian,
            'nama_bagian' => $this->nama_bagian,
            'deskripsi' => $this->deskripsi,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'jumlah_pic' => $this->whenCounted('pics'),
            'jumlah_pengguna' => $this->whenCounted('users'),
            'jumlah_layanan' => $this->whenCounted('layanans'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
