<?php

namespace App\Services\Auth;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Logika bisnis registrasi akun mandiri.
 *
 * Titik penyesuaian untuk branch lain:
 *  - aturan (domain email, NIK, sandi, role & status bawaan) -> config/register.php
 *  - aksi tambahan setelah akun dibuat (email sambutan, notifikasi ke Admin,
 *    log audit, dll.) -> buat Listener untuk event Illuminate\Auth\Events\Registered
 *  - cara section dicari -> override resolveBagianId()
 */
class RegistrationService
{
    /**
     * @param  array{name: string, nik: string, email: string, password: string, section?: string|null, id_bagian?: int|null}  $data
     */
    public function register(array $data): User
    {
        $bagianId = $this->resolveBagianId($data);

        $user = DB::transaction(fn (): User => User::create([
            'name' => $data['name'],
            'nik' => $data['nik'],
            'email' => $data['email'],
            'password' => $data['password'], // di-hash oleh cast 'hashed'
            'id_bagian' => $bagianId,
            // Pendaftar mandiri SELALU Karyawan (PRD D9); peran lain hanya diberikan Admin.
            // Sengaja tidak dapat diatur lewat request maupun .env. Status dari config.
            'role' => Role::Employee,
            'status' => $this->defaultStatus(),
        ]));

        event(new Registered($user));

        return $user->load('bagian');
    }

    /** Status bawaan dari konfigurasi; kembali ke Aktif bila nilainya tidak sah. */
    protected function defaultStatus(): StatusAkun
    {
        return StatusAkun::tryFrom((string) config('register.default_status')) ?? StatusAkun::Aktif;
    }

    /**
     * Tentukan id bagian dari `id_bagian` langsung atau `section` (kode_bagian).
     *
     * @param  array<string, mixed>  $data
     */
    protected function resolveBagianId(array $data): int
    {
        if (! empty($data['id_bagian'])) {
            return (int) $data['id_bagian'];
        }

        $id = Bagian::aktif()->where('kode_bagian', $data['section'] ?? '')->value('id');

        if (! $id) {
            // Validasi sudah memeriksa; ini pengaman bila data master berubah di tengah proses.
            throw ValidationException::withMessages([
                'section' => 'Section belum tersedia di sistem. Hubungi Administrator.',
            ]);
        }

        return (int) $id;
    }
}
