<?php

namespace App\Enums;

/** Peran pengguna. Disimpan di users.role. */
enum Role: string
{
    case Employee = 'employee';
    case Supervisor = 'supervisor';
    case Pic = 'pic';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Employee => 'Karyawan',
            self::Supervisor => 'Supervisor',
            self::Pic => 'PIC',
            self::Admin => 'Administrator',
        };
    }
}
