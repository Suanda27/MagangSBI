<?php

namespace Database\Factories;

use App\Enums\StatusAkun;
use App\Models\Plant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Plant>
 */
class PlantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nama_plant' => 'Plant '.fake()->unique()->numberBetween(1, 9999),
            'status' => StatusAkun::Aktif,
        ];
    }

    public function nonaktif(): static
    {
        return $this->state(fn () => ['status' => StatusAkun::Nonaktif]);
    }
}
