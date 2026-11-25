<?php

namespace App\Services;

use App\Enums\AksiRiwayat;
use App\Enums\JenisLampiran;
use App\Enums\Role;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Exceptions\BelumJatuhTempo;
use App\Exceptions\TiketSudahDiambil;
use App\Exceptions\TransisiTidakValid;
use App\Models\Lampiran;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use App\Support\HariKerja;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

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
 * Semua perpindahan status sudah berfungsi: terima, tolak, ubahStatus, kirimHasil, setujui, mintaRevisi,
 * dan tutupOtomatis (dijalankan perintah terjadwal).
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
     * PIC penanggung jawab mengirim hasil kerja untuk ditinjau karyawan (Diproses/Pending → Menunggu Konfirmasi).
     * Minimal 1 bukti. Bukti disimpan sebagai lampiran jenis "penyelesaian" dengan nomor putaran berikutnya,
     * sehingga bukti putaran lama tidak hilang saat ada revisi.
     *
     * @param  list<UploadedFile>  $bukti
     */
    public function kirimHasil(Permintaan $permintaan, User $pic, array $bukti, ?string $catatan = null): Permintaan
    {
        if ($bukti === []) {
            throw ValidationException::withMessages(['bukti' => 'Lampirkan minimal 1 bukti hasil kerja.']);
        }

        $tersimpan = collect();

        try {
            $hasil = DB::transaction(function () use ($permintaan, $pic, $bukti, $catatan, &$tersimpan) {
                $diperbarui = Permintaan::query()
                    ->whereKey($permintaan->id)
                    ->where('id_pic', $pic->id)
                    ->whereIn('status', [StatusPermintaan::InProgress->value, StatusPermintaan::Pending->value])
                    ->update([
                        'status' => StatusPermintaan::WaitingReview->value,
                        'dikirim_pada' => now(),
                        'catatan_hasil' => $this->bersihkan($catatan),
                        'alasan_pending' => null,
                        'updated_at' => now(),
                    ]);

                if ($diperbarui === 0) {
                    $this->gagalMengubah($permintaan, $pic, StatusPermintaan::WaitingReview);
                }

                $putaran = ((int) Lampiran::query()
                    ->where('id_permintaan', $permintaan->id)
                    ->where('jenis', JenisLampiran::Penyelesaian->value)
                    ->max('putaran')) + 1;

                $tersimpan = app(FileUploadService::class)->simpan($permintaan, $pic, $bukti, JenisLampiran::Penyelesaian, $putaran);

                $this->catat($permintaan, $pic, StatusPermintaan::WaitingReview, AksiRiwayat::ResultSent, $this->bersihkan($catatan));

                return $permintaan->fresh();
            });
        } catch (Throwable $e) {
            app(FileUploadService::class)->hapusFisik($tersimpan); // jangan sisakan berkas yatim
            throw $e;
        }

        TiketDiubah::dispatch($hasil, AksiRiwayat::ResultSent, $pic);

        return $hasil;
    }

    /** Karyawan pengaju menyetujui hasil (Menunggu Konfirmasi → Selesai, final). */
    public function setujui(Permintaan $permintaan, User $karyawan): Permintaan
    {
        $hasil = DB::transaction(function () use ($permintaan, $karyawan) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('id_karyawan', $karyawan->id)
                ->where('status', StatusPermintaan::WaitingReview->value)
                ->update([
                    'status' => StatusPermintaan::Completed->value,
                    'selesai_pada' => now(),
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                $this->gagalDitinjau($permintaan, $karyawan, StatusPermintaan::Completed);
            }

            $this->catat($permintaan, $karyawan, StatusPermintaan::Completed, AksiRiwayat::Approved);

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, AksiRiwayat::Approved, $karyawan);

        return $hasil;
    }

    /**
     * Karyawan pengaju meminta revisi (Menunggu Konfirmasi → Diproses). Alasan wajib; jumlah_revisi bertambah.
     * Revisi tidak dibatasi jumlahnya (keputusan PRD).
     */
    public function mintaRevisi(Permintaan $permintaan, User $karyawan, string $alasan): Permintaan
    {
        $this->wajibIsi($alasan, 10, 'alasan', 'Alasan revisi minimal 10 karakter.');

        $hasil = DB::transaction(function () use ($permintaan, $karyawan, $alasan) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('id_karyawan', $karyawan->id)
                ->where('status', StatusPermintaan::WaitingReview->value)
                ->update([
                    'status' => StatusPermintaan::InProgress->value,
                    'alasan_revisi' => trim($alasan),
                    'jumlah_revisi' => DB::raw('jumlah_revisi + 1'),
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                $this->gagalDitinjau($permintaan, $karyawan, StatusPermintaan::InProgress);
            }

            $this->catat($permintaan, $karyawan, StatusPermintaan::InProgress, AksiRiwayat::RevisionRequested, trim($alasan));

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, AksiRiwayat::RevisionRequested, $karyawan);

        return $hasil;
    }

    /**
     * Sistem menutup tiket Menunggu Konfirmasi yang tidak ditanggapi karyawan dalam 3 hari kerja sejak hasil
     * dikirim (Menunggu Konfirmasi → Selesai, pelaku = Sistem). Dipanggil oleh perintah terjadwal tiket:tutup-otomatis.
     *
     * Ditolak dengan 409 bila tiket belum jatuh tempo, bukan lagi Menunggu Konfirmasi, atau hasilnya dikirim ulang
     * (revisi) saat perintah berjalan: pembaruan dikunci pada status DAN waktu kirim yang dibaca.
     */
    public function tutupOtomatis(Permintaan $permintaan): Permintaan
    {
        $dikirim = $permintaan->dikirim_pada;

        if ($permintaan->status !== StatusPermintaan::WaitingReview) {
            throw TransisiTidakValid::dari($permintaan->status, StatusPermintaan::Completed);
        }

        if ($dikirim === null || HariKerja::batasTutupOtomatis($dikirim)->isFuture()) {
            throw new BelumJatuhTempo;
        }

        $hasil = DB::transaction(function () use ($permintaan, $dikirim) {
            $diperbarui = Permintaan::query()
                ->whereKey($permintaan->id)
                ->where('status', StatusPermintaan::WaitingReview->value)
                ->where('dikirim_pada', $dikirim)
                ->update([
                    'status' => StatusPermintaan::Completed->value,
                    'selesai_pada' => now(),
                    'updated_at' => now(),
                ]);

            if ($diperbarui === 0) {
                // Karyawan menanggapi atau PIC mengirim ulang tepat saat perintah berjalan.
                throw TransisiTidakValid::dari($permintaan->fresh()?->status ?? $permintaan->status, StatusPermintaan::Completed);
            }

            $this->catat(
                $permintaan,
                null,
                StatusPermintaan::Completed,
                AksiRiwayat::AutoClosed,
                'Ditutup otomatis setelah '.HariKerja::BATAS_TUTUP_OTOMATIS.' hari kerja tanpa tinjauan.',
            );

            return $permintaan->fresh();
        });

        TiketDiubah::dispatch($hasil, AksiRiwayat::AutoClosed, null);

        return $hasil;
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

    /** Sama seperti gagalMengubah, tetapi untuk aksi karyawan pengaju (setujui / minta revisi). */
    private function gagalDitinjau(Permintaan $permintaan, User $karyawan, StatusPermintaan $ke): never
    {
        $terbaru = $permintaan->fresh();

        if ($terbaru === null || (int) $terbaru->id_karyawan !== (int) $karyawan->id) {
            throw new AuthorizationException('Hanya karyawan pengaju yang dapat menanggapi hasil kerja tiket ini.');
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
