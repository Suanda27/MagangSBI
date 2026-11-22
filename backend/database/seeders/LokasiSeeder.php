<?php

namespace Database\Seeders;

use App\Models\Lantai;
use App\Models\Plant;
use Illuminate\Database\Seeder;

/** Master lokasi: plant dan lantainya. */
class LokasiSeeder extends Seeder
{
    public function run(): void
    {
        $lokasi = [
            'Plant 1' => ['Lantai 1', 'Lantai 2', 'Lantai 3'],
            'Plant 2' => ['Lantai 1', 'Lantai 2', 'Lantai 3'],
            'Plant 3' => ['Lantai 1', 'Lantai 2'],
        ];

        foreach ($lokasi as $namaPlant => $daftarLantai) {
            $plant = Plant::updateOrCreate(['nama_plant' => $namaPlant]);

            foreach ($daftarLantai as $namaLantai) {
                Lantai::updateOrCreate(['id_plant' => $plant->id, 'nama_lantai' => $namaLantai]);
            }
        }
    }
}
