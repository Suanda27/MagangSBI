<?php

namespace App\Models;

use App\Enums\StatusAkun;
use Database\Factories\BagianFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Section (Assembly, HR, IS, PE, GA). Kode dipakai pada nomor tiket. */
#[Fillable(['kode_bagian', 'nama_bagian', 'deskripsi', 'status'])]
class Bagian extends Model
{
    /** @use HasFactory<BagianFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['status' => StatusAkun::class];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'id_bagian');
    }

    public function layanans(): HasMany
    {
        return $this->hasMany(Layanan::class, 'id_bagian');
    }

    /** Tiket yang ditujukan ke section ini. */
    public function permintaans(): HasMany
    {
        return $this->hasMany(Permintaan::class, 'id_bagian');
    }

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('status', StatusAkun::Aktif->value);
    }
}
