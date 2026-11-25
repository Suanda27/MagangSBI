<?php

namespace App\Notifications;

use App\Enums\AksiRiwayat;
use App\Models\Permintaan;
use Illuminate\Notifications\Notification;

/**
 * Notifikasi dalam aplikasi (D8: tanpa email) saat tiket berubah. Disimpan di tabel notifications
 * (channel database) dan dibuat langsung, tidak lewat antrean, sehingga tidak bergantung pada pekerja antrean.
 */
class TiketDiperbarui extends Notification
{
    public function __construct(
        public Permintaan $permintaan,
        public AksiRiwayat $aksi,
        public ?string $pelaku = null,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'aksi' => $this->aksi->value,
            'judul' => $this->aksi->judul(),
            'pesan' => $this->pesan(),
            'id_permintaan' => $this->permintaan->id,
            'kode_tiket' => $this->permintaan->kode_tiket,
            'judul_tiket' => $this->permintaan->judul,
        ];
    }

    private function pesan(): string
    {
        $tiket = $this->permintaan->kode_tiket.' "'.$this->permintaan->judul.'"';
        $oleh = $this->pelaku ?? 'Sistem';

        return match ($this->aksi) {
            AksiRiwayat::Submitted => "Tiket baru {$tiket} diajukan oleh {$oleh}.",
            AksiRiwayat::Accepted => "{$tiket} diterima oleh {$oleh} dan mulai dikerjakan.",
            AksiRiwayat::Rejected => "{$tiket} ditolak oleh {$oleh}. Buka tiket untuk melihat alasannya.",
            AksiRiwayat::Paused => "Pengerjaan {$tiket} ditunda oleh {$oleh}.",
            AksiRiwayat::Resumed => "Pengerjaan {$tiket} dilanjutkan oleh {$oleh}.",
            AksiRiwayat::ResultSent => "{$oleh} mengirim hasil kerja untuk {$tiket}. Mohon ditinjau.",
            AksiRiwayat::RevisionRequested => "{$oleh} meminta revisi untuk {$tiket}. Buka tiket untuk melihat alasannya.",
            AksiRiwayat::Approved => "{$oleh} menyetujui hasil kerja {$tiket}. Tiket selesai.",
            AksiRiwayat::AutoClosed => "{$tiket} ditutup otomatis oleh sistem karena tidak ada tanggapan.",
        };
    }
}
