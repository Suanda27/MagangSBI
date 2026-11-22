<?php

namespace App\Enums;

/** Jenis berkas pada tiket. */
enum JenisLampiran: string
{
    /** Berkas pendukung dari karyawan saat mengajukan tiket. */
    case Pengajuan = 'pengajuan';

    /** Bukti hasil kerja dari PIC (dicatat per putaran pengiriman). */
    case Penyelesaian = 'penyelesaian';
}
