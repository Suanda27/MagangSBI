<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representasi user yang aman dikirim ke frontend (tanpa password/token).
 *
 * @mixin User
 */
class UserResource extends JsonResource
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
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'status' => $this->status->value,
            'jabatan' => $this->jabatan,
            'telepon' => $this->telepon,
            'bagian' => $this->whenLoaded('bagian', fn () => $this->bagian ? [
                'id' => $this->bagian->id,
                'kode_bagian' => $this->bagian->kode_bagian,
                'nama_bagian' => $this->bagian->nama_bagian,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
