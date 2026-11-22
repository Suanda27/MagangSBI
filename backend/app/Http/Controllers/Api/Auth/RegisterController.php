<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\RegistrationService;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    /**
     * POST /api/auth/register
     *
     * Hanya membuat akun. Login dipisah (LoginController) agar alur Sanctum
     * (cookie + CSRF) tidak tercampur dengan pembuatan akun.
     */
    public function __invoke(RegisterRequest $request, RegistrationService $registration): JsonResponse
    {
        $user = $registration->register($request->validated());

        return (new UserResource($user))
            ->additional(['message' => 'Registrasi berhasil. Silakan masuk menggunakan akun Anda.'])
            ->response()
            ->setStatusCode(201);
    }
}
