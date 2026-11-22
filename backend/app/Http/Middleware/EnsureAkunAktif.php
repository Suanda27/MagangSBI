<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menolak akun berstatus nonaktif di semua endpoint yang membutuhkan login.
 * Jika Admin menonaktifkan akun saat penggunanya sedang masuk, sesinya ikut diakhiri
 * pada permintaan berikutnya.
 */
class EnsureAkunAktif
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $user->isAktif()) {
            if ($request->hasSession()) {
                auth('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            abort(403, 'Akun Anda dinonaktifkan. Hubungi Administrator.');
        }

        return $next($request);
    }
}
