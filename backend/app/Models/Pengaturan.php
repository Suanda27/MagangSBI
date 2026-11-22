<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Pengaturan sistem (key-value). Kunci yang dipakai:
 * max_upload_mb, format_lampiran, digit_nomor_tiket.
 */
#[Fillable(['kunci', 'nilai'])]
class Pengaturan extends Model
{
    public static function ambil(string $kunci, ?string $default = null): ?string
    {
        return static::query()->where('kunci', $kunci)->value('nilai') ?? $default;
    }

    public static function simpan(string $kunci, string|int|null $nilai): void
    {
        static::query()->updateOrCreate(['kunci' => $kunci], ['nilai' => $nilai === null ? null : (string) $nilai]);
    }
}
