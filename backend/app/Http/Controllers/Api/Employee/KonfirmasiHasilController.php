<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\MintaRevisiRequest;
use App\Http\Resources\PermintaanDetailResource;
use App\Models\Permintaan;
use App\Services\TicketWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Tanggapan karyawan atas hasil kerja PIC (tiket berstatus Menunggu Konfirmasi).
 * Tiket milik orang lain dijawab 404 (keberadaannya tidak dibocorkan); keadaan yang tidak cocok 409.
 */
class KonfirmasiHasilController extends Controller
{
    /** POST /api/employee/permintaan/{id}/setujui — hasil sesuai, tiket Selesai (final). */
    public function setujui(Request $request, int $id, TicketWorkflow $workflow): PermintaanDetailResource
    {
        $tiket = Permintaan::query()->milik($request->user())->findOrFail($id);
        Gate::authorize('setujui', $tiket);

        $workflow->setujui($tiket, $request->user());

        return $this->respons($request, $id);
    }

    /** POST /api/employee/permintaan/{id}/revisi — hasil belum sesuai; tiket kembali Sedang Diproses dengan alasan. */
    public function revisi(MintaRevisiRequest $request, int $id, TicketWorkflow $workflow): PermintaanDetailResource
    {
        $tiket = Permintaan::query()->milik($request->user())->findOrFail($id);
        Gate::authorize('mintaRevisi', $tiket);

        $workflow->mintaRevisi($tiket, $request->user(), $request->validated('alasan'));

        return $this->respons($request, $id);
    }

    private function respons(Request $request, int $id): PermintaanDetailResource
    {
        $tiket = Permintaan::query()
            ->milik($request->user())
            ->with(['layanan', 'bagian', 'plant', 'lantai', 'pic', 'lampirans', 'riwayat.pelaku'])
            ->findOrFail($id);

        return new PermintaanDetailResource($tiket);
    }
}
