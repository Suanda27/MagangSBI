<?php

namespace App\Services;

use App\Enums\JenisLampiran;
use App\Models\Lampiran;
use App\Models\Pengaturan;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Menyimpan lampiran tiket di disk PRIVATE (storage/app/private), bukan folder publik.
 * Berkas hanya bisa diunduh lewat GET /api/lampiran/{id} yang memeriksa hak akses.
 *
 * Aturan (PRD): maksimal 5 berkas per pengiriman, format dan ukuran dari tabel pengaturans
 * (bawaan jpg,png,pdf dan 5 MB). Nama di disk diacak, nama asli hanya disimpan di database.
 */
class FileUploadService
{
    public const DISK = 'local';

    public const MAKS_BERKAS = 5;

    /** Format yang boleh dipilih Admin; di luar daftar ini tidak pernah diterima. */
    private const FORMAT_DIDUKUNG = ['jpg', 'jpeg', 'png', 'pdf'];

    /** @return list<string> ekstensi yang diizinkan, mis. ['jpg', 'jpeg', 'png', 'pdf'] */
    public function formatDiizinkan(): array
    {
        $dipilih = array_filter(array_map('trim', explode(',', strtolower(Pengaturan::ambil('format_lampiran', 'jpg,png,pdf')))));
        $format = array_values(array_intersect($dipilih, self::FORMAT_DIDUKUNG));

        if (in_array('jpg', $format, true) && ! in_array('jpeg', $format, true)) {
            $format[] = 'jpeg'; // jpg dan jpeg adalah format yang sama
        }

        return $format ?: ['jpg', 'jpeg', 'png', 'pdf'];
    }

    public function batasMb(): int
    {
        return max(1, (int) Pengaturan::ambil('max_upload_mb', '5'));
    }

    /**
     * Aturan validasi untuk request yang membawa lampiran (dipakai FormRequest).
     * Pemeriksaan jenis berkas berdasarkan ISI berkas (mimes), bukan hanya nama.
     *
     * @return array<string, array<int, string>>
     */
    public function aturan(string $field = 'lampiran'): array
    {
        return [
            $field => ['nullable', 'array', 'max:'.self::MAKS_BERKAS],
            $field.'.*' => ['file', 'mimes:'.implode(',', $this->formatDiizinkan()), 'max:'.($this->batasMb() * 1024)],
        ];
    }

    /**
     * Simpan berkas dan catat di tabel lampirans. Bila ada yang gagal di tengah jalan,
     * berkas yang sudah tertulis dihapus lagi sebelum error dilempar.
     *
     * @param  iterable<UploadedFile>  $berkas
     * @return Collection<int, Lampiran>
     */
    public function simpan(Permintaan $permintaan, User $pengunggah, iterable $berkas, JenisLampiran $jenis = JenisLampiran::Pengajuan, ?int $putaran = null): Collection
    {
        $hasil = collect();

        try {
            foreach ($berkas as $file) {
                $path = $file->store('lampiran/'.$permintaan->id, self::DISK);

                if ($path === false) {
                    throw new \RuntimeException('Berkas gagal disimpan.');
                }

                $hasil->push(Lampiran::create([
                    'id_permintaan' => $permintaan->id,
                    'id_user' => $pengunggah->id,
                    'jenis' => $jenis,
                    'putaran' => $jenis === JenisLampiran::Penyelesaian ? $putaran : null,
                    'nama_file' => $this->namaAman($file),
                    'path_file' => $path,
                    'tipe_file' => $file->getMimeType() ?: 'application/octet-stream',
                    'ukuran_file' => (int) $file->getSize(),
                ]));
            }
        } catch (Throwable $e) {
            $this->hapusFisik($hasil);
            throw $e;
        }

        return $hasil;
    }

    /**
     * Hapus berkas fisik dari disk (baris database tidak disentuh). Dipanggil bila transaksi
     * pembuatan tiket di-rollback agar tidak tersisa berkas yatim.
     *
     * @param  iterable<Lampiran>  $lampirans
     */
    public function hapusFisik(iterable $lampirans): void
    {
        foreach ($lampirans as $lampiran) {
            Storage::disk(self::DISK)->delete($lampiran->path_file);
        }
    }

    /** Nama asli tanpa folder dan karakter kontrol, dipotong agar muat di kolom. */
    private function namaAman(UploadedFile $file): string
    {
        $nama = basename(str_replace('\\', '/', $file->getClientOriginalName()));
        $nama = preg_replace('/[\x00-\x1F\x7F]/u', '', $nama) ?? '';

        return mb_substr($nama !== '' ? $nama : 'berkas', 0, 200);
    }
}
