<?php

namespace App\Services\Admin;

use App\Exceptions\DataMasihDipakai;
use App\Models\Bagian;
use App\Models\Permintaan;
use App\Models\User;

/**
 * Penjaga integritas master data (PRD: data dinonaktifkan, tidak dihapus).
 * Perubahan yang akan membuat tiket berjalan kehilangan penanggung jawab atau tujuan
 * ditolak dengan 409. Pemeriksaan ini berjalan SETELAH validasi (422) lolos.
 */
class MasterDataGuard
{
    /** PIC yang masih memegang tiket berjalan tidak boleh dinonaktifkan, dipindah section, atau diturunkan perannya. */
    public function pastikanPicTidakMemegangTiket(User $pic): void
    {
        $jumlah = Permintaan::query()->ditanganiOleh($pic)->berjalan()->count();

        if ($jumlah > 0) {
            throw new DataMasihDipakai("PIC ini masih menangani {$jumlah} tiket yang belum selesai. Selesaikan atau alihkan tiket tersebut terlebih dahulu.");
        }
    }

    /** Section yang masih punya tiket berjalan tidak boleh dinonaktifkan. */
    public function pastikanSectionTanpaTiketBerjalan(Bagian $bagian): void
    {
        $jumlah = Permintaan::query()->untukSection($bagian->id)->berjalan()->count();

        if ($jumlah > 0) {
            throw new DataMasihDipakai("Section ini masih memiliki {$jumlah} tiket yang belum selesai, sehingga belum dapat dinonaktifkan.");
        }
    }
}
