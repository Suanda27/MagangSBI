<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lampiran;
use App\Services\FileUploadService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LampiranController extends Controller
{
    /**
     * GET /api/lampiran/{id} — unduh lampiran. Hanya yang berhak melihat tiketnya
     * (PermintaanPolicy::unduhLampiran): 403 bila tidak berhak, 404 bila berkas tidak ada.
     */
    public function show(Lampiran $lampiran): StreamedResponse
    {
        Gate::authorize('unduhLampiran', $lampiran->permintaan);

        $disk = Storage::disk(FileUploadService::DISK);
        abort_unless($disk->exists($lampiran->path_file), 404, 'Berkas tidak ditemukan.');

        return $disk->download($lampiran->path_file, $lampiran->nama_file, [
            'Content-Type' => $lampiran->tipe_file,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
