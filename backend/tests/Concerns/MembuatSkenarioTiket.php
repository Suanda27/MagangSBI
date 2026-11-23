<?php

namespace Tests\Concerns;

use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\User;

/**
 * Skenario bersama untuk tes hak akses dan workflow:
 * dua section (IS dan GA), PIC dan Supervisor di tiap section, dua karyawan, dan satu admin.
 * Ada DUA PIC di IS supaya penerimaan ganda bisa diuji.
 */
trait MembuatSkenarioTiket
{
    protected Bagian $bagianIs;

    protected Bagian $bagianGa;

    protected Layanan $layananIs;

    protected Layanan $layananGa;

    protected User $picIs;

    protected User $picIs2;

    protected User $picGa;

    protected User $supIs;

    protected User $supGa;

    protected User $admin;

    protected User $karyawan;

    protected User $karyawanLain;

    protected function siapkanSkenario(): void
    {
        $this->bagianIs = Bagian::factory()->create(['kode_bagian' => 'IS']);
        $this->bagianGa = Bagian::factory()->create(['kode_bagian' => 'GA']);
        $this->layananIs = Layanan::factory()->create(['id_bagian' => $this->bagianIs->id]);
        $this->layananGa = Layanan::factory()->create(['id_bagian' => $this->bagianGa->id]);

        $this->picIs = User::factory()->pic($this->bagianIs)->create();
        $this->picIs2 = User::factory()->pic($this->bagianIs)->create();
        $this->picGa = User::factory()->pic($this->bagianGa)->create();
        $this->supIs = User::factory()->supervisor($this->bagianIs)->create();
        $this->supGa = User::factory()->supervisor($this->bagianGa)->create();
        $this->admin = User::factory()->admin()->create();
        $this->karyawan = User::factory()->employee($this->bagianGa)->create();
        $this->karyawanLain = User::factory()->employee($this->bagianGa)->create();
    }

    /** Tiket baru milik $karyawan yang ditujukan ke section IS. */
    protected function tiketIs(): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);
    }

    /** Tiket baru milik $karyawan yang ditujukan ke section GA. */
    protected function tiketGa(): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananGa->id,
            'id_karyawan' => $this->karyawan->id,
        ]);
    }
}
