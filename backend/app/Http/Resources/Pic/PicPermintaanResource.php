<?php

namespace App\Http\Resources\Pic;

use App\Http\Resources\PermintaanResource;
use App\Models\Permintaan;
use Illuminate\Http\Request;

/**
 * Tiket dalam daftar PIC: sama dengan versi karyawan, tetapi memakai label umum (bukan "Diajukan")
 * dan menyertakan pengaju.
 *
 * @mixin Permintaan
 */
class PicPermintaanResource extends PermintaanResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'status_label' => $this->status->label(),
            'pengaju' => $this->whenLoaded('pengaju', fn () => $this->pengaju ? [
                'id' => $this->pengaju->id,
                'name' => $this->pengaju->name,
                'nik' => $this->pengaju->nik,
                'jabatan' => $this->pengaju->jabatan,
                'bagian' => $this->pengaju->relationLoaded('bagian') ? $this->pengaju->bagian?->nama_bagian : null,
            ] : null),
            // Ada bila relasi dimuat (daftar Admin); detail PIC memuatnya sendiri.
            'pic' => $this->whenLoaded('pic', fn () => $this->pic ? ['id' => $this->pic->id, 'name' => $this->pic->name] : null),
            'diterima_pada' => $this->diterima_pada?->toIso8601String(),
            'selesai_pada' => $this->selesai_pada?->toIso8601String(),
            'diperbarui_pada' => $this->updated_at?->toIso8601String(),
        ]);
    }
}
