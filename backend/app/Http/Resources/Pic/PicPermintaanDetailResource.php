<?php

namespace App\Http\Resources\Pic;

use App\Http\Resources\PermintaanDetailResource;
use App\Models\Permintaan;
use Illuminate\Http\Request;

/**
 * Detail tiket untuk PIC: lengkap dengan data pengaju, lampiran, hasil kerja, dan riwayat.
 * Muat relasi pengaju.bagian, pic, lampirans, dan riwayat.pelaku sebelum dipakai.
 *
 * @mixin Permintaan
 */
class PicPermintaanDetailResource extends PermintaanDetailResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        // Tombol Sesuai/Revisi milik karyawan; PIC tidak memerlukannya.
        unset($data['bisa_ditinjau']);

        return array_merge($data, [
            'status_label' => $this->status->label(),
            'pengaju' => $this->whenLoaded('pengaju', fn () => $this->pengaju ? [
                'id' => $this->pengaju->id,
                'name' => $this->pengaju->name,
                'nik' => $this->pengaju->nik,
                'jabatan' => $this->pengaju->jabatan,
                'telepon' => $this->pengaju->telepon,
                'bagian' => $this->pengaju->bagian?->nama_bagian,
            ] : null),
        ]);
    }
}
