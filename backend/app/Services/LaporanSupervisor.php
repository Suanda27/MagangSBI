<?php

namespace App\Services;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Http\Requests\Supervisor\LaporanSupervisorRequest;
use App\Models\Layanan;
use App\Models\Permintaan;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;

/**
 * Isi Laporan Supervisor sesuai PRD Bagian 7 (tanpa SLA, D1): jumlah tiket per status, per layanan, dan per
 * kategori; rata-rata durasi penyelesaian; rata-rata revisi per tiket; jumlah tiket ditutup otomatis; tren
 * per periode; dan daftar tiket (diambil controller dari kueri yang sama).
 *
 * Kueri dasar, angka total, per status, dan statistik selesai dipakai ulang dari LaporanTiket (milik Faiz,
 * tidak diubah). Di sini hanya ditambah hitungan yang belum ada di sana. Semua angka berasal dari filter yang
 * sama, jadi kartu, grafik, tabel, dan berkas ekspor selalu konsisten.
 */
class LaporanSupervisor
{
    /** Batas hari untuk granularitas tren. */
    private const MAKS_HARI_PER_HARI = 31;

    private const MAKS_HARI_PER_MINGGU = 180;

    public function __construct(private readonly LaporanTiket $laporan) {}

    /** Kueri tiket terfilter (sudah terkunci ke section supervisor oleh request). */
    public function query(LaporanSupervisorRequest $f): Builder
    {
        return $this->laporan->query($f);
    }

    /**
     * @return array{
     *     total:int, per_status:array<string,int>, per_layanan:list<array<string,mixed>>,
     *     per_kategori:list<array<string,mixed>>, selesai:array<string,mixed>, rata_revisi:?float,
     *     ditutup_otomatis:int, granularitas:string, tren:list<array<string,mixed>>
     * }
     */
    public function ringkasan(LaporanSupervisorRequest $f): array
    {
        $dasar = $this->laporan->ringkasan($f);
        $perLayanan = $this->perLayanan($f);

        return [
            'total' => $dasar['total'],
            'per_status' => $dasar['per_status'],
            'per_layanan' => $perLayanan,
            'per_kategori' => $this->perKategori($perLayanan),
            'selesai' => $dasar['selesai'],
            'rata_revisi' => $dasar['total'] > 0 ? round((float) $this->query($f)->avg('jumlah_revisi'), 2) : null,
            'ditutup_otomatis' => $this->query($f)
                ->whereHas('riwayat', fn ($r) => $r->where('aksi', AksiRiwayat::AutoClosed->value))
                ->count(),
            ...$this->tren($f),
        ];
    }

    /** @return list<array{id:int, nama_layanan:string, kategori:string, jumlah:int}> terbanyak dulu */
    private function perLayanan(LaporanSupervisorRequest $f): array
    {
        $jumlah = $this->query($f)->selectRaw('id_layanan, count(*) as jumlah')->groupBy('id_layanan')->pluck('jumlah', 'id_layanan');

        return Layanan::query()->whereIn('id', $jumlah->keys())->get(['id', 'nama_layanan', 'kategori'])
            ->map(fn (Layanan $l) => [
                'id' => $l->id,
                'nama_layanan' => $l->nama_layanan,
                'kategori' => $l->kategori,
                'jumlah' => (int) $jumlah[$l->id],
            ])
            ->sort(fn ($a, $b) => [$b['jumlah'], $a['nama_layanan']] <=> [$a['jumlah'], $b['nama_layanan']])
            ->values()->all();
    }

    /**
     * @param  list<array<string,mixed>>  $perLayanan
     * @return list<array{kategori:string, jumlah:int}> terbanyak dulu
     */
    private function perKategori(array $perLayanan): array
    {
        return collect($perLayanan)->groupBy('kategori')
            ->map(fn ($baris, $kategori) => ['kategori' => (string) $kategori, 'jumlah' => (int) $baris->sum('jumlah')])
            ->sort(fn ($a, $b) => [$b['jumlah'], $a['kategori']] <=> [$a['jumlah'], $b['kategori']])
            ->values()->all();
    }

    /**
     * Tren tiket per periode menurut tanggal pengajuan. Granularitas mengikuti panjang rentang:
     * sampai 31 hari per hari, sampai 180 hari per minggu (mulai Senin), selebihnya per bulan.
     * Periode tanpa tiket tetap muncul dengan angka nol agar grafik tidak bolong. Dihitung di PHP dari dua
     * kolom saja supaya sama di MariaDB dan SQLite.
     *
     * @return array{granularitas:string, tren:list<array<string,mixed>>}
     */
    private function tren(LaporanSupervisorRequest $f): array
    {
        $baris = $this->query($f)->get(['created_at', 'status']);

        if ($baris->isEmpty()) {
            return ['granularitas' => 'hari', 'tren' => []];
        }

        $awal = ($f->dari() ?? CarbonImmutable::instance($baris->min('created_at')))->startOfDay();
        $akhir = ($f->sampai() ?? CarbonImmutable::instance($baris->max('created_at')))->endOfDay();
        $hari = (int) $awal->diffInDays($akhir->startOfDay()) + 1;

        [$granularitas, $langkah, $kunci, $label] = match (true) {
            $hari <= self::MAKS_HARI_PER_HARI => ['hari', '1 day', 'Y-m-d', 'd M'],
            $hari <= self::MAKS_HARI_PER_MINGGU => ['minggu', '1 week', 'Y-m-d', 'd M'],
            default => ['bulan', '1 month', 'Y-m', 'M Y'],
        };

        $mulai = match ($granularitas) {
            'minggu' => fn (CarbonImmutable $t) => $t->startOfWeek(),
            'bulan' => fn (CarbonImmutable $t) => $t->startOfMonth(),
            default => fn (CarbonImmutable $t) => $t->startOfDay(),
        };

        $kelompok = $baris->groupBy(fn (Permintaan $t) => $mulai(CarbonImmutable::instance($t->created_at))->format($kunci));

        $tren = [];
        foreach (CarbonPeriod::create($mulai($awal), $langkah, $akhir) as $periode) {
            $periode = CarbonImmutable::instance($periode);
            $anggota = $kelompok->get($periode->format($kunci), collect());
            $tren[] = [
                'kunci' => $periode->format($kunci),
                'label' => $periode->locale('id')->translatedFormat($label),
                'diajukan' => $anggota->count(),
                'selesai' => $anggota->where('status', StatusPermintaan::Completed)->count(),
            ];
        }

        return ['granularitas' => $granularitas, 'tren' => $tren];
    }
}
