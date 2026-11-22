<?php

namespace Database\Factories;

use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use App\Models\Lantai;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\Plant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Tiket yang konsisten: section tujuan mengikuti layanan, lantai mengikuti plant.
 * kode_tiket di sini hanya untuk tes; format sebenarnya dibuat TicketNumberGenerator (Sprint 2).
 *
 * @extends Factory<Permintaan>
 */
class PermintaanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kode_tiket' => 'TST-'.strtoupper(Str::random(10)),
            'id_karyawan' => User::factory(),
            'id_layanan' => Layanan::factory(),
            'id_bagian' => fn (array $a) => Layanan::query()->findOrFail($a['id_layanan'])->id_bagian,
            'id_pic' => null,
            'id_plant' => Plant::factory(),
            'id_lantai' => fn (array $a) => Lantai::factory()->create(['id_plant' => $a['id_plant']])->id,
            'lokasi_detail' => fake()->streetName(),
            'judul' => fake()->sentence(5),
            'deskripsi' => fake()->paragraph(),
            'prioritas' => Prioritas::Normal,
            'status' => StatusPermintaan::Submitted,
            'jumlah_revisi' => 0,
        ];
    }

    public function prioritas(Prioritas $prioritas): static
    {
        return $this->state(fn () => ['prioritas' => $prioritas]);
    }

    /** Sudah diterima PIC dan sedang dikerjakan. PIC harus dari section yang sama dengan tiket. */
    public function dalamProses(?User $pic = null): static
    {
        return $this->state(fn () => [
            'status' => StatusPermintaan::InProgress,
            'id_pic' => $pic?->id ?? User::factory()->pic(),
            'diterima_pada' => now(),
        ]);
    }

    public function menungguKonfirmasi(?User $pic = null): static
    {
        return $this->dalamProses($pic)->state(fn () => [
            'status' => StatusPermintaan::WaitingReview,
            'dikirim_pada' => now(),
            'catatan_hasil' => fake()->sentence(),
        ]);
    }

    public function selesai(?User $pic = null): static
    {
        return $this->menungguKonfirmasi($pic)->state(fn () => [
            'status' => StatusPermintaan::Completed,
            'selesai_pada' => now(),
        ]);
    }

    public function ditolak(?User $pic = null): static
    {
        return $this->state(fn () => [
            'status' => StatusPermintaan::Rejected,
            'id_pic' => $pic?->id ?? User::factory()->pic(),
            'ditolak_pada' => now(),
            'alasan_tolak' => 'Di luar cakupan layanan section ini.',
        ]);
    }
}
