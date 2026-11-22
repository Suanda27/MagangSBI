<?php

namespace App\Services;

use App\Enums\AksiRiwayat;
use App\Enums\Role;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Exceptions\TiketSudahDiambil;
use App\Exceptions\TransisiTidakValid;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use BadMethodCallException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Satu-satunya tempat yang boleh memindahkan status tiket (PRD Bagian 4).
 *
 * Aturan umum setiap metode:
 *  1. Perubahan dilakukan dengan UPDATE BERSYARAT yang atomik (kondisi status + pemilik ada di klausa WHERE),
 *     bukan "baca lalu simpan". Dengan begitu dua PIC yang menekan Terima bersamaan tidak bisa sama-sama menang.
 *  2. Status + riwayat ditulis dalam SATU transaksi.
 *  3. Event TiketDiubah dikirim setelah transaksi selesai.
 *
 * Kegagalan:
 *  - AuthorizationException  → 403 (bukan hak pelaku; biasanya sudah dicegah PermintaanPolicy)
 *  - TiketSudahDiambil, TransisiTidakValid → 409 (keadaan tiket sudah berubah)
 *  - ValidationException     → 422 (alasan terlalu pendek)
 *
 * Status Sprint 1: terima, tolak, ubahStatus sudah berfungsi. kirimHasil, setujui, mintaRevisi,
 * dan tutupOtomatis masih rangka dan diisi pada Sprint 3.
 */
class TicketWorkflow
{
    /** PIC section tujuan menerima tiket baru. PIC pertama yang berhasil menjadi penanggung jawab. */
    public function terima(Permintaan $permintaan, User $pic, ?string $catatan = null): Permintaan
    {
        $this->pastikanPicSection($permintaan, $pic);

        $hasil = DB::transaction(function () use ($permintaan, $pic, $catatan) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('id_bagian', $pic->id_bagian)
                ->where('status', StatusPermintaan::Submitted->value)
                ->whereNull('id_pic')
                ->update([
                    'status' => StatusPermintaan::InProgress->value,
                    'id_pic' => $pic->id,
                    'diterima_pada' => now(),
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                throw new TiketSudahDiambil;
            }

            $this->catat($permintaan, $pic, StatusPermintaan::InProgress, AksiRiwayat::Accepted, $this->bersihkan($catatan));

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, AksiRiwayat::Accepted, $pic);

        return $hasil;
    }

    /** PIC section tujuan menolak tiket baru. Alasan wajib. PIC yang menolak dicatat sebagai id_pic (asumsi A4). */
    public function tolak(Permintaan $permintaan, User $pic, string $alasan): Permintaan
    {
        $this->pastikanPicSection($permintaan, $pic);
        $this->wajibIsi($alasan, 10, 'alasan', 'Alasan penolakan minimal 10 karakter.');

        $hasil = DB::transaction(function () use ($permintaan, $pic, $alasan) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('id_bagian', $pic->id_bagian)
                ->where('status', StatusPermintaan::Submitted->value)
                ->whereNull('id_pic')
                ->update([
                    'status' => StatusPermintaan::Rejected->value,
                    'id_pic' => $pic->id,
                    'ditolak_pada' => now(),
                    'alasan_tolak' => trim($alasan),
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                throw new TiketSudahDiambil;
            }

            $this->catat($permintaan, $pic, StatusPermintaan::Rejected, AksiRiwayat::Rejected, trim($alasan));

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, AksiRiwayat::Rejected, $pic);

        return $hasil;
    }

    /**
     * PIC penanggung jawab menunda (Diproses → Pending, alasan wajib) atau melanjutkan (Pending → Diproses).
     */
    public function ubahStatus(Permintaan $permintaan, User $pic, StatusPermintaan $ke, ?string $catatan = null): Permintaan
    {
        if (! in_array($ke, [StatusPermintaan::InProgress, StatusPermintaan::Pending], true)) {
            throw TransisiTidakValid::dari($permintaan->status, $ke);
        }

        if ($ke === StatusPermintaan::Pending) {
            $this->wajibIsi($catatan, 5, 'alasan', 'Alasan penundaan minimal 5 karakter.');
        }

        $dari = $ke === StatusPermintaan::Pending ? StatusPermintaan::InProgress : StatusPermintaan::Pending;
        $aksi = $ke === StatusPermintaan::Pending ? AksiRiwayat::Paused : AksiRiwayat::Resumed;

        $hasil = DB::transaction(function () use ($permintaan, $pic, $ke, $dari, $aksi, $catatan) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('id_pic', $pic->id)
                ->where('status', $dari->value)
                ->update([
                    'status' => $ke->value,
                    'alasan_pending' => $ke === StatusPermintaan::Pending ? trim((string) $catatan) : null,
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                $this->gagalMengubah($permintaan, $pic, $ke);
            }

            $this->catat($permintaan, $pic, $ke, $aksi, $this->bersihkan($catatan));

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, $aksi, $pic);

        return $hasil;
    }

    /**
     * Sprint 3: PIC mengirim hasil kerja (minimal 1 bukti) → waiting_review, mengisi dikirim_pada
     * dan lampiran jenis "penyelesaian" dengan nomor putaran berikutnya.
     *
     * @param  list<mixed>  $bukti
     */
    public function kirimHasil(Permintaan $permintaan, User $pic, array $bukti, ?string $catatan = null): Permintaan
    {
        throw new BadMethodCallException('TicketWorkflow::kirimHasil akan diimplementasikan pada Sprint 3.');
    }

    /** Sprint 3: karyawan pengaju menyetujui hasil (waiting_review → completed). */
    public function setujui(Permintaan $permintaan, User $karyawan): Permintaan
    {
        throw new BadMethodCallException('TicketWorkflow::setujui akan diimplementasikan pada Sprint 3.');
    }

    /** Sprint 3: karyawan pengaju meminta revisi (waiting_review → in_progress, jumlah_revisi bertambah). */
    public function mintaRevisi(Permintaan $permintaan, User $karyawan, string $alasan): Permintaan
    {
        throw new BadMethodCallException('TicketWorkflow::mintaRevisi akan diimplementasikan pada Sprint 3.');
    }

    /** Sprint 4: tutup otomatis tiket waiting_review yang lewat 3 hari kerja (waiting_review → completed). */
    public function tutupOtomatis(Permintaan $permintaan): Permintaan
    {
        throw new BadMethodCallException('TicketWorkflow::tutupOtomatis akan diimplementasikan pada Sprint 4.');
    }

    // ---- Pembantu -----------------------------------------------------

    /** Pertahanan berlapis: walau Policy sudah memeriksa, service menolak PIC dari section lain. */
    private function pastikanPicSection(Permintaan $permintaan, User $pic): void
    {
        $berhak = $pic->role === Role::Pic
            && $pic->isAktif()
            && $pic->id_bagian !== null
            && (int) $pic->id_bagian === (int) $permintaan->id_bagian;

        if (! $berhak) {
            throw new AuthorizationException('PIC hanya dapat menangani tiket yang masuk ke section-nya.');
        }
    }

    /** UPDATE bersyarat tidak mengenai baris mana pun: cari tahu penyebabnya agar jawabannya tepat. */
    private function gagalMengubah(Permintaan $permintaan, User $pic, StatusPermintaan $ke): never
    {
        $terbaru = $permintaan->fresh();

        if ($terbaru === null || (int) $terbaru->id_pic !== (int) $pic->id) {
            throw new AuthorizationException('Hanya PIC penanggung jawab yang dapat mengubah status tiket ini.');
        }

        throw TransisiTidakValid::dari($terbaru->status, $ke);
    }

    private function catat(Permintaan $permintaan, ?User $pelaku, StatusPermintaan $status, AksiRiwayat $aksi, ?string $keterangan = null): RiwayatPermintaan
    {
        return RiwayatPermintaan::create([
            'id_permintaan' => $permintaan->id,
            'id_user' => $pelaku?->id,
            'status' => $status,
            'aksi' => $aksi,
            'keterangan' => $keterangan,
        ]);
    }

    private function wajibIsi(?string $teks, int $minimal, string $field, string $pesan): void
    {
        if (mb_strlen(trim((string) $teks)) < $minimal) {
            throw ValidationException::withMessages([$field => $pesan]);
        }
    }

    private function bersihkan(?string $teks): ?string
    {
        $teks = trim((string) $teks);

        return $teks === '' ? null : $teks;
    }
}
