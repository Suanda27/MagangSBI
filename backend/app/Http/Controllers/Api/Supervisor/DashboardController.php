<?php

namespace App\Http\Controllers\Api\Supervisor;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/supervisor/dashboard — ringkasan tiket yang ditujukan ke SECTION supervisor
     * (aturan A1). Tiket section lain tidak ikut terhitung maupun terlihat. Tanpa SLA (D1):
     * yang ditampilkan hanya jumlah, rata-rata durasi penyelesaian, dan rata-rata revisi.
     */
    public function index(Request $request): JsonResponse
    {
        $supervisor = $request->user();
        $idBagian = (int) $supervisor->id_bagian;
        $supervisor->loadMissing('bagian');

        // id_bagian 0 tidak cocok dengan section mana pun: akun tanpa section melihat data kosong.
        $tiket = fn () => Permintaan::query()->untukSection($idBagian);

        $hitung = $tiket()->selectRaw('status, count(*) as jumlah')->groupBy('status')->pluck('jumlah', 'status');
        $perStatus = [];
        foreach (StatusPermintaan::cases() as $status) {
            $perStatus[$status->value] = (int) ($hitung[$status->value] ?? 0);
        }
        $total = array_sum($perStatus);
        $selesai = $perStatus[StatusPermintaan::Completed->value];

        $terbaru = $tiket()
            ->with(['layanan', 'pengaju', 'pic'])
            ->latest()->latest('id')
            ->limit(6)
            ->get()
            ->map(fn (Permintaan $t) => [
                'id' => $t->id,
                'kode_tiket' => $t->kode_tiket,
                'judul' => $t->judul,
                'status' => $t->status->value,
                'status_label' => $t->status->label(),
                'prioritas' => $t->prioritas->value,
                'prioritas_label' => $t->prioritas->label(),
                'layanan' => $t->layanan?->nama_layanan,
                'pengaju' => $t->pengaju?->name,
                'pic' => $t->pic?->name,
                'dibuat_pada' => $t->created_at?->toIso8601String(),
            ])->values();

        $aktivitas = RiwayatPermintaan::query()
            ->whereHas('permintaan', fn ($q) => $q->untukSection($idBagian))
            ->with(['permintaan:id,kode_tiket,judul', 'pelaku:id,name'])
            ->latest()->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (RiwayatPermintaan $r) => [
                'id' => $r->id,
                'aksi' => $r->aksi->value,
                'judul' => $r->aksi->judul(),
                'status' => $r->status->value,
                'kode_tiket' => $r->permintaan?->kode_tiket,
                'judul_tiket' => $r->permintaan?->judul,
                'pelaku' => $r->pelaku?->name ?? 'Sistem',
                'waktu' => $r->created_at?->toIso8601String(),
            ])->values();

        return response()->json([
            'data' => [
                'bagian' => $supervisor->bagian ? [
                    'id' => $supervisor->bagian->id,
                    'kode_bagian' => $supervisor->bagian->kode_bagian,
                    'nama_bagian' => $supervisor->bagian->nama_bagian,
                ] : null,
                'total' => $total,
                'berjalan' => array_sum(array_intersect_key($perStatus, array_flip(StatusPermintaan::aktif()))),
                'baru_hari_ini' => $tiket()->where('created_at', '>=', now()->startOfDay())->count(),
                'per_status' => $perStatus,
                'rasio_selesai' => $total > 0 ? round($selesai / $total * 100, 1) : null,
                'rata_durasi_jam' => $this->rataDurasiJam($tiket),
                'rata_revisi' => $total > 0 ? round((float) $tiket()->avg('jumlah_revisi'), 2) : null,
                'terbaru' => $terbaru,
                'aktivitas' => $aktivitas,
            ],
        ]);
    }

    /** Rata-rata jam dari tiket dibuat sampai selesai (hanya tiket Selesai); null bila belum ada. */
    private function rataDurasiJam(callable $tiket): ?float
    {
        $selang = $tiket()
            ->where('status', StatusPermintaan::Completed->value)
            ->whereNotNull('selesai_pada')
            ->get(['created_at', 'selesai_pada'])
            ->map(fn (Permintaan $t) => $t->created_at->diffInSeconds($t->selesai_pada, true));

        return $selang->isEmpty() ? null : round($selang->avg() / 3600, 1);
    }
}
