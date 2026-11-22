<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** Kata sandi yang dipakai factory (di-hash sekali agar tes cepat). */
    protected static ?string $password;

    /**
     * Default: karyawan aktif tanpa section.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nik' => (string) fake()->unique()->numerify('2201####'),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => Role::Employee,
            'id_bagian' => null,
            'jabatan' => fake()->jobTitle(),
            'telepon' => fake()->phoneNumber(),
            'status' => StatusAkun::Aktif,
            'remember_token' => Str::random(10),
        ];
    }

    public function employee(Bagian|int|null $bagian = null): static
    {
        return $this->state(fn () => ['role' => Role::Employee, 'id_bagian' => $this->idBagian($bagian)]);
    }

    /** PIC selalu terikat ke satu section. */
    public function pic(Bagian|int|null $bagian = null): static
    {
        return $this->state(fn () => ['role' => Role::Pic, 'id_bagian' => $this->idBagian($bagian) ?? Bagian::factory()]);
    }

    public function supervisor(Bagian|int|null $bagian = null): static
    {
        return $this->state(fn () => ['role' => Role::Supervisor, 'id_bagian' => $this->idBagian($bagian) ?? Bagian::factory()]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => Role::Admin, 'id_bagian' => null]);
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => StatusAkun::Nonaktif]);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    private function idBagian(Bagian|int|null $bagian): ?int
    {
        return $bagian instanceof Bagian ? $bagian->id : $bagian;
    }
}
