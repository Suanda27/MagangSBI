<?php

namespace App\Models;

use Database\Factories\PlantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Master lokasi: plant. */
#[Fillable(['nama_plant'])]
class Plant extends Model
{
    /** @use HasFactory<PlantFactory> */
    use HasFactory;

    public function lantais(): HasMany
    {
        return $this->hasMany(Lantai::class, 'id_plant');
    }
}
