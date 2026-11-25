<?php

namespace App\Http\Controllers\Api\Pic;

use App\Enums\StatusPermintaan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Pic\TerimaPermintaanRequest;
use App\Http\Requests\Pic\TolakPermintaanRequest;
use App\Http\Requests\Pic\UbahStatusPermintaanRequest;
use App\Http\Resources\Pic\PicPermintaanDetailResource;
use App\Models\Permintaan;
use App\Services\TicketWorkflow;
use Illuminate\Support\Facades\Gate;

/**
 * Aksi PIC pada tiket. Pembagian tugas:
 *   - PermintaanPolicy  : apakah PIC ini berhak?            → 403
 *   - TicketWorkflow    : apakah keadaan tiket memungkinkan? → 409 (dan 422 untuk alasan terlalu pendek)
 */
class AksiPermintaanController extends Controller
{
    /** POST /api/pic/permintaan/{id}/terima — PIC section tujuan mengambil tiket baru (Diajukan → Diproses). */
    public function terima(TerimaPermintaanRequest $request, int $id, TicketWorkflow $workflow): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()->findOrFail($id);
        Gate::authorize('terima', $tiket);

        $workflow->terima($tiket, $request->user(), $request->validated('catatan'));

        return $this->respons($id);
    }

    /** POST /api/pic/permintaan/{id}/tolak — PIC section tujuan menolak tiket baru dengan alasan (Diajukan → Ditolak). */
    public function tolak(TolakPermintaanRequest $request, int $id, TicketWorkflow $workflow): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()->findOrFail($id);
        Gate::authorize('tolak', $tiket);

        $workflow->tolak($tiket, $request->user(), $request->validated('alasan'));

        return $this->respons($id);
    }

    /** POST /api/pic/permintaan/{id}/status — PIC penanggung jawab menunda (pending) atau melanjutkan (in_progress). */
    public function ubahStatus(UbahStatusPermintaanRequest $request, int $id, TicketWorkflow $workflow): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()->findOrFail($id);
        Gate::authorize('ubahStatus', $tiket);

        $workflow->ubahStatus(
            $tiket,
            $request->user(),
            StatusPermintaan::from($request->validated('status')),
            $request->validated('alasan'),
        );

        return $this->respons($id);
    }

    /** Detail terbaru setelah aksi, supaya frontend langsung punya status dan riwayat yang baru. */
    private function respons(int $id): PicPermintaanDetailResource
    {
        $tiket = Permintaan::query()
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'pengaju.bagian', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        return new PicPermintaanDetailResource($tiket);
    }
}
