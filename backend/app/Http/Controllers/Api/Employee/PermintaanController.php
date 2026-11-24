<?php

namespace App\Http\Controllers\Api\Employee;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StorePermintaanRequest;
use App\Http\Resources\PermintaanResource;
use App\Services\TicketCreator;
use Illuminate\Http\JsonResponse;

class PermintaanController extends Controller
{
    /**
     * POST /api/employee/permintaan (multipart) — ajukan tiket baru.
     * Nomor tiket, section tujuan, dan status ditentukan server (karyawan tidak bisa mengisinya).
     */
    public function store(StorePermintaanRequest $request, TicketCreator $pembuat): JsonResponse
    {
        $tiket = $pembuat->buat(
            $request->user(),
            $request->safe()->except('lampiran'),
            $request->file('lampiran', []),
        );

        return (new PermintaanResource($tiket))
            ->response()
            ->setStatusCode(201);
    }
}
