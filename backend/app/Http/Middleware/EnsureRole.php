<?php

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Membatasi route berdasarkan peran pengguna.
 *
 * Pemakaian pada route: ->middleware(['auth:sanctum', 'akun.aktif', 'role:pic'])
 * atau beberapa peran sekaligus: 'role:supervisor,admin'.
 *
 * Aturan ini dijaga di SERVER. Menyembunyikan menu di frontend tidak menggantikannya.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        abort_if($user === null, 401, 'Silakan login terlebih dahulu.');

        // Role::from() melempar error bila nama peran salah ketik, jadi kesalahan konfigurasi terlihat cepat.
        $diizinkan = array_map(fn (string $peran) => Role::from($peran), $roles);

        abort_unless($user->hasRole(...$diizinkan), 403, 'Anda tidak memiliki akses ke sumber daya ini.');

        return $next($request);
    }
}
