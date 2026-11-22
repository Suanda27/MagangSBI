<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Penghitung nomor tiket per section per tahun. Dipakai TicketNumberGenerator (Sprint 2). */
#[Fillable(['id_bagian', 'tahun', 'terakhir'])]
class UrutanTiket extends Model
{
    public function bagian(): BelongsTo
    {
        return $this->belongsTo(Bagian::class, 'id_bagian');
    }
}
