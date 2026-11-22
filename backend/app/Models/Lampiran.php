<?php

namespace App\Models;

use App\Enums\JenisLampiran;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Berkas pengajuan (karyawan) atau bukti hasil kerja (PIC, per putaran). Disimpan di disk private. */
#[Fillable(['id_permintaan', 'id_user', 'jenis', 'putaran', 'nama_file', 'path_file', 'tipe_file', 'ukuran_file'])]
class Lampiran extends Model
{
    protected function casts(): array
    {
        return [
            'jenis' => JenisLampiran::class,
            'putaran' => 'integer',
            'ukuran_file' => 'integer',
        ];
    }

    public function permintaan(): BelongsTo
    {
        return $this->belongsTo(Permintaan::class, 'id_permintaan');
    }

    public function pengunggah(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
