<?php

namespace Database\Factories;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\Layanan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Layanan>
 */
class LayananFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_layanan' => strtoupper(fake()->unique()->bothify('??-##')),
            'nama_layanan' => fake()->unique()->words(3, true),
            'kategori' => fake()->randomElement(['Dukungan IT', 'Fasilitas & Gedung', 'Admin Karyawan']),
            'deskripsi' => fake()->sentence(),
            'id_bagian' => Bagian::factory(),
            'status' => StatusAkun::Aktif,
        ];
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => StatusAkun::Nonaktif]);
    }
}
