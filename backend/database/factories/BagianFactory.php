<?php

namespace Database\Factories;

use App\Enums\StatusAkun;
use App\Models\Bagian;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bagian>
 */
class BagianFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_bagian' => strtoupper(fake()->unique()->lexify('???')),
            'nama_bagian' => fake()->unique()->company(),
            'deskripsi' => fake()->sentence(),
            'status' => StatusAkun::Aktif,
        ];
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => StatusAkun::Nonaktif]);
    }
}
