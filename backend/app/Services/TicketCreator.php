<?php

namespace App\Services;

use App\Enums\AksiRiwayat;
use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Models\Lampiran;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Membuat tiket baru oleh karyawan (PRD 5.3 dan 6.3).
 *
 * Dalam SATU transaksi: nomor tiket, tiket (status submitted), riwayat pertama, dan lampiran.
 * Bila ada yang gagal, semuanya dibatalkan, termasuk nomor tiket dan berkas yang sudah tertulis.
 */
class TicketCreator
{
    public function __construct(
        private readonly TicketNumberGenerator $nomor,
        private readonly FileUploadService $unggah,
    ) {}

    /**
     * @param  array{id_layanan:int, id_plant:int, id_lantai:int, lokasi_detail?:?string, judul:string, deskripsi:string, prioritas?:?string}  $data
     * @param  iterable<UploadedFile>  $lampiran
     */
    public function buat(User $karyawan, array $data, iterable $lampiran = []): Permintaan
    {
        /** @var Collection<int, Lampiran> $tersimpan */
        $tersimpan = collect();

        try {
            $tiket = DB::transaction(function () use ($karyawan, $data, $lampiran, &$tersimpan) {
                $layanan = Layanan::query()->findOrFail($data['id_layanan']);

                $tiket = Permintaan::create([
                    'kode_tiket' => $this->nomor->generate($layanan->id_bagian),
                    'id_karyawan' => $karyawan->id,
                    'id_layanan' => $layanan->id,
                    'id_bagian' => $layanan->id_bagian, // section tujuan disalin dari layanan
                    'id_pic' => null,
                    'id_plant' => $data['id_plant'],
                    'id_lantai' => $data['id_lantai'],
                    'lokasi_detail' => $data['lokasi_detail'] ?? null,
                    'judul' => $data['judul'],
                    'deskripsi' => $data['deskripsi'],
                    'prioritas' => Prioritas::tryFrom((string) ($data['prioritas'] ?? '')) ?? Prioritas::Normal,
                    'status' => StatusPermintaan::Submitted,
                    'jumlah_revisi' => 0,
                ]);

                RiwayatPermintaan::create([
                    'id_permintaan' => $tiket->id,
                    'id_user' => $karyawan->id,
                    'status' => StatusPermintaan::Submitted,
                    'aksi' => AksiRiwayat::Submitted,
                    'keterangan' => null,
                ]);

                $tersimpan = $this->unggah->simpan($tiket, $karyawan, $lampiran);

                return $tiket;
            });
        } catch (Throwable $e) {
            $this->unggah->hapusFisik($tersimpan); // jangan sisakan berkas yatim
            throw $e;
        }

        TiketDiubah::dispatch($tiket, AksiRiwayat::Submitted, $karyawan);

        return $tiket->load(['layanan', 'bagian', 'plant', 'lantai', 'lampirans']);
    }
}
