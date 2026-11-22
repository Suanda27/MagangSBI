<?php

namespace App\Enums;

/**
 * Status tiket dan aturan perpindahannya (PRD Bagian 4).
 *
 *   submitted ──accept──▶ in_progress ◀──▶ pending
 *       └──reject──▶ rejected             │
 *   in_progress / pending ──kirim hasil──▶ waiting_review
 *   waiting_review ──setujui / tutup otomatis──▶ completed
 *   waiting_review ──revisi──▶ in_progress
 *
 * completed dan rejected bersifat final.
 */
enum StatusPermintaan: string
{
    case Submitted = 'submitted';
    case InProgress = 'in_progress';
    case Pending = 'pending';
    case WaitingReview = 'waiting_review';
    case Completed = 'completed';
    case Rejected = 'rejected';

    /** @return list<self> status tujuan yang diizinkan dari status ini */
    public function tujuanDiizinkan(): array
    {
        return match ($this) {
            self::Submitted => [self::InProgress, self::Rejected],
            self::InProgress => [self::Pending, self::WaitingReview],
            self::Pending => [self::InProgress, self::WaitingReview],
            self::WaitingReview => [self::Completed, self::InProgress],
            self::Completed, self::Rejected => [],
        };
    }

    public function bolehKe(self $tujuan): bool
    {
        return in_array($tujuan, $this->tujuanDiizinkan(), true);
    }

    /** Status final tidak dapat diubah lagi. */
    public function isFinal(): bool
    {
        return $this === self::Completed || $this === self::Rejected;
    }

    /** Label umum (sudut pandang PIC / Admin). */
    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Menunggu Pemeriksaan',
            self::InProgress => 'Sedang Diproses',
            self::Pending => 'Pending',
            self::WaitingReview => 'Menunggu Konfirmasi',
            self::Completed => 'Selesai',
            self::Rejected => 'Ditolak',
        };
    }

    /** Label dari sudut pandang karyawan pengaju. */
    public function labelKaryawan(): string
    {
        return $this === self::Submitted ? 'Diajukan' : $this->label();
    }

    /** @return list<string> nilai status yang masih berjalan (belum final) */
    public static function aktif(): array
    {
        return [self::Submitted->value, self::InProgress->value, self::Pending->value, self::WaitingReview->value];
    }
}
