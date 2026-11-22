<?php

namespace App\Enums;

/** Status akun dan master data. Data dinonaktifkan, tidak dihapus. */
enum StatusAkun: string
{
    case Aktif = 'aktif';
    case Nonaktif = 'nonaktif';

    public function label(): string
    {
        return match ($this) {
            self::Aktif => 'Aktif',
            self::Nonaktif => 'Nonaktif',
        };
    }
}
