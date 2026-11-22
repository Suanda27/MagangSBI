<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Sanctum mode SPA (PRD D5): sesi berbasis cookie, bukan token di browser.
 * Frontend memanggil GET /sanctum/csrf-cookie sebelum login.
 */
class LoginController extends Controller
{
    /** POST /api/auth/login */
    public function login(LoginRequest $request): JsonResponse
    {
        // Sesi hanya ada pada permintaan dari frontend (domain stateful Sanctum).
        // Tanpa sesi, login "berhasil" tetapi tidak tersimpan, jadi tolak dengan jelas.
        if (! $request->hasSession()) {
            return response()->json([
                'message' => 'Permintaan login harus berasal dari aplikasi frontend (domain stateful).',
            ], 400);
        }

        $request->authenticate();

        $user = Auth::guard('web')->user();

        // Akun nonaktif: dicek SETELAH sandi benar supaya pesannya jelas tanpa membocorkan akun.
        if (! $user->isAktif()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Akun Anda dinonaktifkan. Hubungi Administrator.',
            ], 403);
        }

        $request->session()->regenerate();

        return (new UserResource($user->load('bagian')))
            ->additional(['message' => 'Berhasil masuk.'])
            ->response();
    }

    /** POST /api/auth/logout */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Anda telah keluar.']);
    }

    /** GET /api/auth/me */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('bagian'));
    }
}
