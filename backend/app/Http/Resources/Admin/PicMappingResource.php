<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * PIC beserta section tugasnya. tiket_aktif = tiket berjalan yang sedang ia pegang.
 *
 * @mixin User
 */
class PicMappingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'nik' => $this->nik,
            'email' => $this->email,
            'jabatan' => $this->jabatan,
            'telepon' => $this->telepon,
            'role' => $this->role->value,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'bagian' => $this->whenLoaded('bagian', fn () => $this->bagian ? [
                'id' => $this->bagian->id,
                'kode_bagian' => $this->bagian->kode_bagian,
                'nama_bagian' => $this->bagian->nama_bagian,
            ] : null),
            // Hitungan dengan alias (withCount ... as tiket_aktif), jadi dibaca langsung dari atribut.
            'tiket_aktif' => $this->when(
                array_key_exists('tiket_aktif', $this->resource->getAttributes()),
                fn () => (int) $this->tiket_aktif,
            ),
        ];
    }
}
