<?php

namespace App\Http\Resources\Supervisor;

use App\Http\Resources\PermintaanDetailResource;
use Illuminate\Http\Request;

/**
 * Detail tiket untuk supervisor (read-only). Memakai bentuk detail yang sama dengan karyawan
 * (lampiran, hasil kerja per putaran, riwayat), dengan label status umum dan data pengaju.
 * Penanda bisa_ditinjau dibuang karena supervisor tidak menanggapi hasil kerja.
 */
class PermintaanSupervisorDetailResource extends PermintaanDetailResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);
        unset($data['bisa_ditinjau']);

        $data['status_label'] = $this->status->label();
        $data['pengaju'] = $this->whenLoaded('pengaju', fn () => $this->pengaju ? [
            'id' => $this->pengaju->id,
            'name' => $this->pengaju->name,
            'jabatan' => $this->pengaju->jabatan,
        ] : null);

        return $data;
    }
}
