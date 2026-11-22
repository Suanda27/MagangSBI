<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\StatusAkun;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Satu tabel untuk semua peran (Karyawan, Supervisor, PIC, Admin), dibedakan oleh kolom role.
 * id_bagian = section karyawan; untuk PIC/Supervisor = section tugasnya.
 */
#[Fillable(['nik', 'name', 'email', 'password', 'role', 'id_bagian', 'jabatan', 'telepon', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /**
     * HasApiTokens tidak dipakai untuk login (mode SPA memakai cookie), tetapi dibutuhkan agar
     * pembantu tes Sanctum::actingAs($user) bisa dipakai. Tabel token tidak dibuat.
     *
     * @use HasFactory<UserFactory>
     */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'status' => StatusAkun::class,
        ];
    }

    public function bagian(): BelongsTo
    {
        return $this->belongsTo(Bagian::class, 'id_bagian');
    }

    /** Tiket yang diajukan pengguna ini sebagai karyawan. */
    public function permintaanDiajukan(): HasMany
    {
        return $this->hasMany(Permintaan::class, 'id_karyawan');
    }

    /** Tiket yang ditangani pengguna ini sebagai PIC. */
    public function permintaanDitangani(): HasMany
    {
        return $this->hasMany(Permintaan::class, 'id_pic');
    }

    public function hasRole(Role ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isEmployee(): bool
    {
        return $this->role === Role::Employee;
    }

    public function isSupervisor(): bool
    {
        return $this->role === Role::Supervisor;
    }

    public function isPic(): bool
    {
        return $this->role === Role::Pic;
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    public function isAktif(): bool
    {
        return $this->status === StatusAkun::Aktif;
    }
}
