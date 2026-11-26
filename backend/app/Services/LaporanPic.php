<?php

namespace App\Services;

use App\Enums\StatusPermintaan;
use App\Http\Requests\Pic\LaporanPicRequest;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Bahan Laporan PIC: statistik pribadi atas tiket yang DITANGANI PIC itu sendiri (id_pic = dia, termasuk yang ia tolak),
 * dalam rentang tanggal pengajuan dan section pengaju yang dipilih. Tiket PIC lain tidak ikut terhitung.
 */
class LaporanPic
{
    public function __construct(private readonly LaporanTiket $laporan) {}

    public function query(User $pic, LaporanPicRequest $f): Builder
    {
        return Permintaan::query()
            ->ditanganiOleh($pic)
            ->when($f->dari(), fn (Builder $q, $dari) => $q->where('created_at', '>=', $dari))
            ->when($f->sampai(), fn (Builder $q, $sampai) => $q->where('created_at', '<=', $sampai))
            ->when($f->filled('id_bagian_pengaju'), fn (Builder $q) => $q->whereIn(
                'id_karyawan',
                User::query()->where('id_bagian', (int) $f->query('id_bagian_pengaju'))->select('id'),
            ));
    }

    /**
     * @return array<string, mixed>
     */
    public function ringkasan(User $pic, LaporanPicRequest $f): array
    {
        $baru = fn () => $this->query($pic, $f);

        $perStatusMentah = $baru()->selectRaw('status, count(*) as jumlah')->groupBy('status')->pluck('jumlah', 'status');
        $perStatus = [];
        foreach (StatusPermintaan::cases() as $s) {
            $perStatus[$s->value] = (int) ($perStatusMentah[$s->value] ?? 0);
        }

        // Pengelompokan per layanan: jumlah semua tiket, dan waktu penyelesaian tiket yang sudah selesai.
        $perLayanan = $baru()->selectRaw('id_layanan, count(*) as jumlah')->groupBy('id_layanan')->pluck('jumlah', 'id_layanan');
        $layanans = Layanan::query()->whereIn('id', $perLayanan->keys())->get(['id', 'nama_layanan', 'kategori'])->keyBy('id');

        $detikSelesai = [];
        $baru()->where('status', StatusPermintaan::Completed->value)->whereNotNull('selesai_pada')
            ->select(['id', 'id_layanan', 'created_at', 'selesai_pada'])
            ->each(function (Permintaan $t) use (&$detikSelesai) {
                $detikSelesai[$t->id_layanan][] = max(0, $t->selesai_pada->getTimestamp() - $t->created_at->getTimestamp());
            });

        $topLayanan = $perLayanan->sortDesc()->take(5)->map(function ($jumlah, $id) use ($layanans, $detikSelesai) {
            $detik = $detikSelesai[$id] ?? [];

            return [
                'id' => (int) $id,
                'nama_layanan' => $layanans[$id]->nama_layanan ?? '-',
                'jumlah' => (int) $jumlah,
                'selesai' => count($detik),
                'rata_rata_jam' => $detik === [] ? null : round(array_sum($detik) / count($detik) / 3600, 1),
            ];
        })->values()->all();

        $perKategori = [];
        foreach ($perLayanan as $id => $jumlah) {
            $kategori = $layanans[$id]->kategori ?? 'Lainnya';
            $perKategori[$kategori] = ($perKategori[$kategori] ?? 0) + (int) $jumlah;
        }
        arsort($perKategori);

        // Section asal pengaju: dihitung dari pengajunya (PHP, tanpa join, supaya kolom tidak ambigu).
        $perPengaju = $baru()->selectRaw('id_karyawan, count(*) as jumlah')->groupBy('id_karyawan')->pluck('jumlah', 'id_karyawan');
        $bagianPengaju = User::query()->whereIn('id', $perPengaju->keys())->pluck('id_bagian', 'id');
        $perBagian = [];
        foreach ($perPengaju as $idKaryawan => $jumlah) {
            $idBagian = $bagianPengaju[$idKaryawan] ?? null;
            $perBagian[$idBagian] = ($perBagian[$idBagian] ?? 0) + (int) $jumlah;
        }
        $namaBagian = Bagian::query()->whereIn('id', array_filter(array_keys($perBagian)))->pluck('nama_bagian', 'id');
        $perBagianPengaju = collect($perBagian)
            ->map(fn ($jumlah, $id) => ['id' => $id ?: null, 'nama_bagian' => $namaBagian[$id] ?? 'Tidak diketahui', 'jumlah' => $jumlah])
            ->sortByDesc('jumlah')->values()->all();

        $total = array_sum($perStatus);

        return [
            'total' => $total,
            'per_status' => $perStatus,
            'per_kategori' => collect($perKategori)->map(fn ($jumlah, $nama) => ['kategori' => $nama, 'jumlah' => $jumlah])->values()->all(),
            'per_bagian_pengaju' => $perBagianPengaju,
            'top_layanan' => $topLayanan,
            'selesai' => $this->laporan->statistikSelesai($baru, $perStatus[StatusPermintaan::Completed->value]),
            // Tidak terpengaruh filter: tiket baru di section PIC yang masih menunggu keputusan siapa pun.
            'antrean_saat_ini' => Permintaan::query()->antreanUntuk($pic)->count(),
        ];
    }
}
