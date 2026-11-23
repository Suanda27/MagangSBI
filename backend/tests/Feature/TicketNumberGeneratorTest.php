<?php

namespace Tests\Feature;

use App\Models\Bagian;
use App\Models\Pengaturan;
use App\Models\UrutanTiket;
use App\Services\TicketNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Nomor tiket: {kode_bagian}-{tahun}-{urutan}. */
class TicketNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private function generator(): TicketNumberGenerator
    {
        return app(TicketNumberGenerator::class);
    }

    public function test_format_dan_urutan_bertambah(): void
    {
        $ga = Bagian::factory()->create(['kode_bagian' => 'GA']);

        $this->assertSame('GA-2026-0001', $this->generator()->generate($ga, 2026));
        $this->assertSame('GA-2026-0002', $this->generator()->generate($ga, 2026));
        $this->assertSame('GA-2026-0003', $this->generator()->generate($ga->id, 2026));
    }

    public function test_urutan_terpisah_per_section_dan_per_tahun(): void
    {
        $ga = Bagian::factory()->create(['kode_bagian' => 'GA']);
        $is = Bagian::factory()->create(['kode_bagian' => 'IS']);

        $this->assertSame('GA-2026-0001', $this->generator()->generate($ga, 2026));
        $this->assertSame('IS-2026-0001', $this->generator()->generate($is, 2026));
        $this->assertSame('GA-2027-0001', $this->generator()->generate($ga, 2027));
        $this->assertSame('GA-2026-0002', $this->generator()->generate($ga, 2026));
    }

    public function test_jumlah_digit_mengikuti_pengaturan(): void
    {
        Pengaturan::simpan('digit_nomor_tiket', 6);
        $pe = Bagian::factory()->create(['kode_bagian' => 'PE']);

        $this->assertSame('PE-2026-000001', $this->generator()->generate($pe, 2026));
    }

    public function test_tahun_bawaan_adalah_tahun_berjalan(): void
    {
        $hr = Bagian::factory()->create(['kode_bagian' => 'HR']);

        $this->assertSame('HR-'.now()->year.'-0001', $this->generator()->generate($hr));
    }

    public function test_penghitung_tersimpan_di_urutan_tikets(): void
    {
        $ga = Bagian::factory()->create(['kode_bagian' => 'GA']);
        $this->generator()->generate($ga, 2026);
        $this->generator()->generate($ga, 2026);

        $this->assertSame(2, UrutanTiket::where(['id_bagian' => $ga->id, 'tahun' => 2026])->value('terakhir'));
    }

    public function test_nomor_dikembalikan_bila_transaksi_pembuat_tiket_gagal(): void
    {
        $ga = Bagian::factory()->create(['kode_bagian' => 'GA']);

        try {
            DB::transaction(function () use ($ga) {
                $this->generator()->generate($ga, 2026);
                throw new \RuntimeException('gagal membuat tiket');
            });
        } catch (\RuntimeException) {
            // diharapkan
        }

        $this->assertSame('GA-2026-0001', $this->generator()->generate($ga, 2026), 'tidak boleh ada nomor bolong');
    }
}
