<?php

namespace App\Enums;

/**
 * Jenis kejadian pada riwayat tiket. Dibutuhkan karena beberapa kejadian
 * berstatus sama (mis. revision_requested dan resumed sama-sama in_progress).
 */
enum AksiRiwayat: string
{
    case Submitted = 'submitted';                   // tiket diajukan
    case Accepted = 'accepted';                     // diterima PIC
    case Rejected = 'rejected';                     // ditolak PIC
    case Paused = 'paused';                         // ditunda (pending)
    case Resumed = 'resumed';                       // dilanjutkan dari pending
    case ResultSent = 'result_sent';                // hasil kerja dikirim untuk ditinjau
    case RevisionRequested = 'revision_requested';  // karyawan meminta revisi
    case Approved = 'approved';                     // karyawan menyetujui hasil
    case AutoClosed = 'auto_closed';                // ditutup otomatis oleh sistem

    public function judul(): string
    {
        return match ($this) {
            self::Submitted => 'Permintaan Diajukan',
            self::Accepted => 'Permintaan Diterima',
            self::Rejected => 'Permintaan Ditolak',
            self::Paused => 'Pengerjaan Ditunda (Pending)',
            self::Resumed => 'Pengerjaan Dilanjutkan',
            self::ResultSent => 'Hasil Kerja Dikirim untuk Ditinjau',
            self::RevisionRequested => 'Revisi Diminta',
            self::Approved => 'Hasil Disetujui',
            self::AutoClosed => 'Ditutup Otomatis oleh Sistem',
        };
    }
}
