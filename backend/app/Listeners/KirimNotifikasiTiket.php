<?php

namespace App\Listeners;

use App\Enums\AksiRiwayat;
use App\Enums\Role;
use App\Events\TiketDiubah;
use App\Models\User;
use App\Notifications\TiketDiperbarui;
use Illuminate\Support\Collection;
use Throwable;

/**
 * Mengirim notifikasi dalam aplikasi saat tiket berubah, sesuai tabel PRD 4.3:
 *
 *   Tiket baru diajukan                       -> semua PIC aktif di section tujuan
 *   Diterima / ditolak / ditunda / dilanjutkan -> karyawan pengaju
 *   Hasil kerja dikirim                        -> karyawan pengaju
 *   Revisi diminta / hasil disetujui           -> PIC penanggung jawab
 *   Ditutup otomatis                           -> karyawan pengaju dan PIC penanggung jawab
 *
 * Pelaku tidak diberi notifikasi atas tindakannya sendiri, dan akun nonaktif dilewati.
 * Kegagalan di sini tidak boleh menggagalkan perubahan status yang sudah tersimpan, jadi dicatat saja.
 */
class KirimNotifikasiTiket
{
    public function handle(TiketDiubah $event): void
    {
        try {
            $penerima = $this->penerima($event);
            $namaPelaku = $event->pelaku?->name;

            foreach ($penerima as $akun) {
                $akun->notify(new TiketDiperbarui($event->permintaan, $event->aksi, $namaPelaku));
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** @return Collection<int, User> */
    private function penerima(TiketDiubah $event): Collection
    {
        $tiket = $event->permintaan;

        $calon = match ($event->aksi) {
            AksiRiwayat::Submitted => User::query()
                ->where('role', Role::Pic->value)
                ->where('id_bagian', $tiket->id_bagian)
                ->get(),

            AksiRiwayat::Accepted,
            AksiRiwayat::Rejected,
            AksiRiwayat::Paused,
            AksiRiwayat::Resumed,
            AksiRiwayat::ResultSent => $this->akun($tiket->id_karyawan),

            AksiRiwayat::RevisionRequested,
            AksiRiwayat::Approved => $this->akun($tiket->id_pic),

            AksiRiwayat::AutoClosed => $this->akun($tiket->id_karyawan)->merge($this->akun($tiket->id_pic)),
        };

        return $calon
            ->filter(fn (User $u) => $u->isAktif() && $u->id !== $event->pelaku?->id)
            ->unique('id')
            ->values();
    }

    /** @return Collection<int, User> kosong bila id tidak ada (mis. tiket belum punya PIC) */
    private function akun(?int $id): Collection
    {
        return $id === null ? collect() : User::query()->whereKey($id)->get();
    }
}
