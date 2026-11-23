<?php

namespace App\Http\Resources\Admin;

use App\Models\Lantai;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Lantai untuk halaman Admin (semua status).
 *
 * @mixin Lantai
 */
class LantaiResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_lantai' => $this->nama_lantai,
            'id_plant' => $this->id_plant,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'plant' => $this->whenLoaded('plant', fn () => [
                'id' => $this->plant->id,
                'nama_plant' => $this->plant->nama_plant,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
