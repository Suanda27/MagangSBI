<?php

namespace App\Http\Resources\Admin;

use App\Models\Plant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Plant untuk halaman Admin (semua status). Lantai ikut dikirim bila relasinya dimuat.
 *
 * @mixin Plant
 */
class PlantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_plant' => $this->nama_plant,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'jumlah_lantai' => $this->whenCounted('lantais'),
            'lantais' => LantaiResource::collection($this->whenLoaded('lantais')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
