<?php

namespace App\Models;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Satu baris per perubahan status tiket. id_user kosong = kejadian oleh Sistem. */
#[Fillable(['id_permintaan', 'id_user', 'status', 'aksi', 'keterangan'])]
class RiwayatPermintaan extends Model
{
    protected function casts(): array
    {
        return [
            'status' => StatusPermintaan::class,
            'aksi' => AksiRiwayat::class,
        ];
    }

    public function permintaan(): BelongsTo
    {
        return $this->belongsTo(Permintaan::class, 'id_permintaan');
    }

    /** Pelaku (null = Sistem). */
    public function pelaku(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
