<?php

namespace App\Models;

use Database\Factories\LantaiFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Master lokasi: lantai di dalam plant. */
#[Fillable(['nama_lantai', 'id_plant'])]
class Lantai extends Model
{
    /** @use HasFactory<LantaiFactory> */
    use HasFactory;

    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class, 'id_plant');
    }
}
