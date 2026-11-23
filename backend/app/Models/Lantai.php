<?php

namespace App\Models;

use App\Enums\StatusAkun;
use Database\Factories\LantaiFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Master lokasi: lantai di dalam plant. Dinonaktifkan, tidak dihapus. */
#[Fillable(['nama_lantai', 'id_plant', 'status'])]
class Lantai extends Model
{
    /** @use HasFactory<LantaiFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['status' => StatusAkun::class];
    }

    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class, 'id_plant');
    }

    public function scopeAktif(Builder $query): Builder
    {
        return $query->where('status', StatusAkun::Aktif->value);
    }
}
