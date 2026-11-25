<?php

namespace App\Http\Resources;

use App\Enums\JenisLampiran;
use App\Enums\StatusPermintaan;
use App\Models\Lampiran;
use App\Models\Permintaan;
use Illuminate\Http\Request;

/**
 * Detail tiket untuk karyawan pengaju: data tiket, lampiran pengajuan, hasil kerja PIC per
 * putaran, dan timeline riwayat. Muat relasi pic, lampirans, dan riwayat.pelaku sebelum dipakai.
 *
 * @mixin Permintaan
 */
class PermintaanDetailResource extends PermintaanResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $lampirans = $this->lampirans;

        return array_merge(parent::toArray($request), [
            'pic' => $this->whenLoaded('pic', fn () => $this->pic ? ['id' => $this->pic->id, 'name' => $this->pic->name] : null),

            // Lampiran pengajuan dipisah dari bukti hasil kerja PIC.
            'lampiran' => $lampirans
                ->filter(fn (Lampiran $l) => $l->jenis === JenisLampiran::Pengajuan)
                ->map(fn (Lampiran $l) => $this->berkas($l))->values(),

            'hasil_kerja' => [
                'catatan' => $this->catatan_hasil,
                'dikirim_pada' => $this->dikirim_pada?->toIso8601String(),
                // Semua putaran tetap terlihat; bukti putaran lama tidak hilang (A6).
                'putaran' => $lampirans
                    ->filter(fn (Lampiran $l) => $l->jenis === JenisLampiran::Penyelesaian)
                    ->groupBy('putaran')
                    ->sortKeys()
                    ->map(fn ($berkas, $putaran) => [
                        'putaran' => (int) $putaran,
                        'berkas' => $berkas->map(fn (Lampiran $l) => $this->berkas($l))->values(),
                    ])->values(),
            ],

            'alasan_tolak' => $this->alasan_tolak,
            'alasan_pending' => $this->alasan_pending,
            'alasan_revisi' => $this->alasan_revisi,
            'jumlah_revisi' => $this->jumlah_revisi,

            'diterima_pada' => $this->diterima_pada?->toIso8601String(),
            'ditolak_pada' => $this->ditolak_pada?->toIso8601String(),
            'selesai_pada' => $this->selesai_pada?->toIso8601String(),

            /** Tombol Sesuai / Perlu Revisi hanya relevan saat menunggu konfirmasi. */
            'bisa_ditinjau' => $this->status === StatusPermintaan::WaitingReview,

            'riwayat' => $this->riwayat->map(fn ($r) => [
                'id' => $r->id,
                'aksi' => $r->aksi->value,
                'judul' => $r->aksi->judul(),
                'status' => $r->status->value,
                'pelaku' => $r->pelaku?->name ?? 'Sistem',
                'keterangan' => $r->keterangan,
                'waktu' => $r->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /** @return array<string, mixed> */
    private function berkas(Lampiran $l): array
    {
        return [
            'id' => $l->id,
            'nama_file' => $l->nama_file,
            'tipe_file' => $l->tipe_file,
            'ukuran_file' => $l->ukuran_file,
            'url' => url('/api/lampiran/'.$l->id),
        ];
    }
}
