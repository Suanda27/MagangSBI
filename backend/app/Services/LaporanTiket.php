<?php

namespace App\Services;

use App\Enums\StatusPermintaan;
use App\Http\Requests\Admin\LaporanAdminRequest;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use Illuminate\Database\Eloquent\Builder;

/**
 * Bahan Laporan Admin: query tiket yang sudah terfilter, ringkasan statistik, dan baris untuk ekspor.
 * Semua angka berasal dari filter yang sama, jadi kartu, grafik, tabel, dan berkas ekspor selalu konsisten.
 */
class LaporanTiket
{
    /** Kolom tanggal acuan rentang laporan: tanggal pengajuan. */
    private const KOLOM_TANGGAL = 'created_at';

    public function query(LaporanAdminRequest $f): Builder
    {
        return Permintaan::query()
            ->when($f->dari(), fn (Builder $q, $dari) => $q->where(self::KOLOM_TANGGAL, '>=', $dari))
            ->when($f->sampai(), fn (Builder $q, $sampai) => $q->where(self::KOLOM_TANGGAL, '<=', $sampai))
            ->when($f->filled('id_bagian'), fn (Builder $q) => $q->where('id_bagian', (int) $f->query('id_bagian')))
            ->when($f->filled('id_layanan'), fn (Builder $q) => $q->where('id_layanan', (int) $f->query('id_layanan')))
            ->when($f->filled('id_pic'), fn (Builder $q) => $q->where('id_pic', (int) $f->query('id_pic')))
            ->when($f->filled('id_plant'), fn (Builder $q) => $q->where('id_plant', (int) $f->query('id_plant')))
            ->when($f->statuses() !== [], fn (Builder $q) => $q->whereIn('status', $f->statuses()));
    }

    /**
     * @return array{total:int, per_status:array<string,int>, per_section:list<array<string,mixed>>, top_layanan:list<array<string,mixed>>, selesai:array<string,mixed>}
     */
    public function ringkasan(LaporanAdminRequest $f): array
    {
        $perStatusMentah = $this->query($f)->selectRaw('status, count(*) as jumlah')->groupBy('status')->pluck('jumlah', 'status');

        $perStatus = [];
        foreach (StatusPermintaan::cases() as $s) {
            $perStatus[$s->value] = (int) ($perStatusMentah[$s->value] ?? 0);
        }

        $perSectionMentah = $this->query($f)->selectRaw('id_bagian, count(*) as jumlah')->groupBy('id_bagian')->pluck('jumlah', 'id_bagian');
        $perSection = Bagian::query()->whereIn('id', $perSectionMentah->keys())->get()
            ->map(fn (Bagian $b) => [
                'id' => $b->id,
                'kode_bagian' => $b->kode_bagian,
                'nama_bagian' => $b->nama_bagian,
                'jumlah' => (int) $perSectionMentah[$b->id],
            ])->sortByDesc('jumlah')->values()->all();

        $topMentah = $this->query($f)->selectRaw('id_layanan, count(*) as jumlah')
            ->groupBy('id_layanan')->orderByDesc('jumlah')->orderBy('id_layanan')->limit(5)->pluck('jumlah', 'id_layanan');
        $namaLayanan = Layanan::query()->whereIn('id', $topMentah->keys())->pluck('nama_layanan', 'id');
        $topLayanan = $topMentah->map(fn ($jumlah, $id) => [
            'id' => (int) $id,
            'nama_layanan' => $namaLayanan[$id] ?? '-',
            'jumlah' => (int) $jumlah,
        ])->values()->all();

        return [
            'total' => array_sum($perStatus),
            'per_status' => $perStatus,
            'per_section' => $perSection,
            'top_layanan' => $topLayanan,
            'selesai' => $this->statistikSelesai($f, $perStatus[StatusPermintaan::Completed->value]),
        ];
    }

    /**
     * Rata-rata waktu penyelesaian (jam, sejak diajukan sampai selesai) dan persentase selesai tanpa revisi.
     * Dihitung di PHP dari dua kolom saja supaya sama di MariaDB dan SQLite.
     *
     * @return array{jumlah:int, rata_rata_jam:?float, tanpa_revisi_persen:?int}
     */
    private function statistikSelesai(LaporanAdminRequest $f, int $jumlah): array
    {
        if ($jumlah === 0) {
            return ['jumlah' => 0, 'rata_rata_jam' => null, 'tanpa_revisi_persen' => null];
        }

        $totalDetik = 0;
        $dihitung = 0;
        $tanpaRevisi = 0;

        $this->query($f)
            ->where('status', StatusPermintaan::Completed->value)
            ->whereNotNull('selesai_pada')
            ->select(['id', self::KOLOM_TANGGAL, 'selesai_pada', 'jumlah_revisi'])
            ->each(function (Permintaan $t) use (&$totalDetik, &$dihitung, &$tanpaRevisi) {
                $totalDetik += max(0, $t->selesai_pada->getTimestamp() - $t->created_at->getTimestamp());
                $dihitung++;
                $tanpaRevisi += $t->jumlah_revisi === 0 ? 1 : 0;
            });

        return [
            'jumlah' => $jumlah,
            'rata_rata_jam' => $dihitung > 0 ? round($totalDetik / $dihitung / 3600, 1) : null,
            'tanpa_revisi_persen' => $dihitung > 0 ? (int) round($tanpaRevisi / $dihitung * 100) : null,
        ];
    }

    /** Relasi yang dibutuhkan baris rekap dan ekspor. */
    public function denganRelasi(Builder $query): Builder
    {
        return $query->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian']);
    }
}
