<?php

namespace App\Policies;

use App\Enums\Role;
use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Models\User;

/**
 * Siapa boleh melakukan apa pada sebuah tiket (PRD 4.4).
 *
 * Pembagian tanggung jawab yang disengaja:
 *   - Policy menjawab "apakah ANDA berhak?"  → gagal = 403 (peran, section, atau kepemilikan salah).
 *   - TicketWorkflow menjawab "apakah KEADAANNYA masih memungkinkan?" → gagal = 409
 *     (mis. tiket sudah diterima PIC lain, atau status sudah berubah).
 * Karena itu aturan terima/tolak di sini TIDAK memeriksa status atau id_pic.
 */
class PermintaanPolicy
{
    /** Akun nonaktif tidak boleh melakukan apa pun. */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAktif() ? null : false;
    }

    /**
     * Melihat tiket (juga dipakai untuk mengunduh lampiran).
     * - Karyawan: tiketnya sendiri.
     * - PIC: tiket baru di section-nya (antrean) dan tiket yang ia tangani.
     * - Supervisor: tiket yang masuk ke section-nya.
     * - Admin: semua.
     */
    public function view(User $user, Permintaan $permintaan): bool
    {
        return match ($user->role) {
            Role::Admin => true,
            Role::Supervisor => $this->sectionSama($user, $permintaan),
            Role::Pic => ($this->sectionSama($user, $permintaan) && $permintaan->status === StatusPermintaan::Submitted)
                || $this->sama($permintaan->id_pic, $user->id),
            Role::Employee => $this->sama($permintaan->id_karyawan, $user->id),
        };
    }

    public function unduhLampiran(User $user, Permintaan $permintaan): bool
    {
        return $this->view($user, $permintaan);
    }

    /** Menerima tiket: PIC dari section tujuan. */
    public function terima(User $user, Permintaan $permintaan): bool
    {
        return $user->isPic() && $this->sectionSama($user, $permintaan);
    }

    /** Menolak tiket: PIC dari section tujuan. */
    public function tolak(User $user, Permintaan $permintaan): bool
    {
        return $this->terima($user, $permintaan);
    }

    /** Mengubah status (Diproses ↔ Pending): PIC penanggung jawab. */
    public function ubahStatus(User $user, Permintaan $permintaan): bool
    {
        return $user->isPic() && $this->sama($permintaan->id_pic, $user->id);
    }

    /** Mengirim hasil kerja untuk ditinjau: PIC penanggung jawab. */
    public function kirimHasil(User $user, Permintaan $permintaan): bool
    {
        return $this->ubahStatus($user, $permintaan);
    }

    /** Menyetujui hasil kerja: karyawan pengaju. */
    public function setujui(User $user, Permintaan $permintaan): bool
    {
        return $user->isEmployee() && $this->sama($permintaan->id_karyawan, $user->id);
    }

    /** Meminta revisi: karyawan pengaju. */
    public function mintaRevisi(User $user, Permintaan $permintaan): bool
    {
        return $this->setujui($user, $permintaan);
    }

    private function sectionSama(User $user, Permintaan $permintaan): bool
    {
        return $this->sama($user->id_bagian, $permintaan->id_bagian);
    }

    private function sama(mixed $a, mixed $b): bool
    {
        return $a !== null && $b !== null && (int) $a === (int) $b;
    }
}
