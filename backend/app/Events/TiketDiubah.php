<?php

namespace App\Events;

use App\Enums\AksiRiwayat;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dikirim SETELAH transaksi perubahan status berhasil disimpan.
 * Pendengar notifikasi dalam aplikasi dibuat pada Sprint 2–3 (milik Syifa);
 * sampai saat itu event ini belum didengarkan siapa pun.
 */
class TiketDiubah
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Permintaan $permintaan,
        public AksiRiwayat $aksi,
        /** Pelaku; null = Sistem (mis. tutup otomatis). */
        public ?User $pelaku = null,
    ) {}
}
