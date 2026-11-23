<?php

namespace App\Models;

use App\Enums\StatusAkun;
use Database\Factories\LayananFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Katalog layanan. Setiap layanan milik satu section (section tujuan tiket). */
#[Fillable(['kode_layanan', 'nama_layanan', 'kategori', 'deskripsi', 'id_bagian', 'status'])]
class Layanan extends Model
{
    /** @use HasFactory<LayananFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['status' => StatusAkun::class];
    }

    public function bagian(): BelongsTo
    {
        return $this->belongsTo(Bagian::class, 'id_bagian');
    }

    public function permintaans(): HasMany
    {
        return $this->hasMany(Permintaan::class, 'id_layanan');
    }

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('status', StatusAkun::Aktif->value);
    }
}
