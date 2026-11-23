<?php

namespace App\Enums;

/** Label urgensi tiket. Hanya pengurut antrean PIC, tanpa SLA (keputusan D1/D2). */
enum Prioritas: string
{
    case Normal = 'normal';
    case Tinggi = 'tinggi';
    case Mendesak = 'mendesak';

    public function label(): string
    {
        return match ($this) {
            self::Normal => 'Normal',
            self::Tinggi => 'Tinggi',
            self::Mendesak => 'Mendesak',
        };
    }

    /** Bobot pengurut: makin besar makin didahulukan. */
    public function bobot(): int
    {
        return match ($this) {
            self::Normal => 1,
            self::Tinggi => 2,
            self::Mendesak => 3,
        };
    }
}
