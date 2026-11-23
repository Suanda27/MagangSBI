<?php

namespace Database\Factories;

use App\Enums\StatusAkun;
use App\Models\Lantai;
use App\Models\Plant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lantai>
 */
class LantaiFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama_lantai' => 'Lantai '.fake()->numberBetween(1, 5),
            'id_plant' => Plant::factory(),
            'status' => StatusAkun::Aktif,
        ];
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => StatusAkun::Nonaktif]);
    }
}
