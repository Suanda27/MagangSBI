<?php

namespace Tests\Feature;

use App\Enums\AksiRiwayat;
use App\Enums\Prioritas;
use App\Enums\Role;
use App\Enums\StatusPermintaan;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Pengaturan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Skema database, seeder, model, dan relasi (Sprint 1 Langkah 2). */
class SkemaDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_membuat_data_master_dan_akun_contoh(): void
    {
        $this->seed();

        $this->assertEqualsCanonicalizing(
            ['ASM', 'HR', 'IS', 'PE', 'GA'],
            Bagian::pluck('kode_bagian')->all(),
        );

        // Setiap section punya katalog layanan.
        foreach (Bagian::withCount('layanans')->get() as $bagian) {
            $this->assertGreaterThan(0, $bagian->layanans_count, "Section {$bagian->kode_bagian} belum punya layanan");
        }

        // Satu admin, satu supervisor per section, dan ada dua PIC di IS untuk uji penerimaan ganda.
        $this->assertSame(1, User::where('role', Role::Admin->value)->count());
        $this->assertSame(5, User::where('role', Role::Supervisor->value)->count());
        $idIs = Bagian::where('kode_bagian', 'IS')->value('id');
        $this->assertSame(2, User::where('role', Role::Pic->value)->where('id_bagian', $idIs)->count());

        $this->assertSame('5', Pengaturan::ambil('max_upload_mb'));
        $this->assertSame('jpg,png,pdf', Pengaturan::ambil('format_lampiran'));
    }

    public function test_seeder_aman_dijalankan_berulang(): void
    {
        $this->seed();
        $awal = [Bagian::count(), Layanan::count(), User::count(), Pengaturan::count()];

        $this->seed();

        $this->assertSame($awal, [Bagian::count(), Layanan::count(), User::count(), Pengaturan::count()]);
    }

    public function test_tiket_mengikuti_section_layanan_dan_lantai_mengikuti_plant(): void
    {
        $this->seed();
        $layanan = Layanan::whereHas('bagian', fn ($q) => $q->where('kode_bagian', 'GA'))->firstOrFail();

        $tiket = Permintaan::factory()->create(['id_layanan' => $layanan->id]);

        $this->assertSame('GA', $tiket->bagian->kode_bagian);
        $this->assertSame($tiket->id_plant, $tiket->lantai->id_plant);
        $this->assertSame(StatusPermintaan::Submitted, $tiket->status);
        $this->assertSame(Prioritas::Normal, $tiket->prioritas);
        $this->assertNull($tiket->id_pic);
    }

    public function test_antrean_pic_hanya_berisi_tiket_baru_di_section_sendiri(): void
    {
        $bagianIs = Bagian::factory()->create(['kode_bagian' => 'IS']);
        $bagianGa = Bagian::factory()->create(['kode_bagian' => 'GA']);
        $layananIs = Layanan::factory()->create(['id_bagian' => $bagianIs->id]);
        $layananGa = Layanan::factory()->create(['id_bagian' => $bagianGa->id]);
        $picIs = User::factory()->pic($bagianIs)->create();

        $baruIs = Permintaan::factory()->create(['id_layanan' => $layananIs->id]);
        Permintaan::factory()->create(['id_layanan' => $layananGa->id]);               // section lain
        Permintaan::factory()->dalamProses($picIs)->create(['id_layanan' => $layananIs->id]); // sudah diambil

        $antrean = Permintaan::antreanUntuk($picIs)->pluck('id')->all();

        $this->assertSame([$baruIs->id], $antrean);
    }

    public function test_antrean_diurutkan_prioritas_lalu_yang_paling_lama(): void
    {
        $bagian = Bagian::factory()->create();
        $layanan = Layanan::factory()->create(['id_bagian' => $bagian->id]);
        $pic = User::factory()->pic($bagian)->create();

        $normalLama = Permintaan::factory()->create(['id_layanan' => $layanan->id, 'created_at' => now()->subDays(3)]);
        $tinggi = Permintaan::factory()->prioritas(Prioritas::Tinggi)->create(['id_layanan' => $layanan->id]);
        $mendesakBaru = Permintaan::factory()->prioritas(Prioritas::Mendesak)->create(['id_layanan' => $layanan->id]);
        $normalBaru = Permintaan::factory()->create(['id_layanan' => $layanan->id, 'created_at' => now()->subDay()]);

        $urutan = Permintaan::antreanUntuk($pic)->urutAntrean()->pluck('id')->all();

        $this->assertSame([$mendesakBaru->id, $tinggi->id, $normalLama->id, $normalBaru->id], $urutan);
    }

    public function test_layanan_yang_sudah_punya_tiket_tidak_bisa_dihapus(): void
    {
        $tiket = Permintaan::factory()->create();

        $this->expectException(QueryException::class);
        Layanan::whereKey($tiket->id_layanan)->delete();
    }

    public function test_pengguna_yang_sudah_punya_tiket_tidak_bisa_dihapus(): void
    {
        $tiket = Permintaan::factory()->create();

        $this->expectException(QueryException::class);
        User::whereKey($tiket->id_karyawan)->delete();
    }

    public function test_pelaku_riwayat_boleh_kosong_untuk_kejadian_sistem(): void
    {
        $tiket = Permintaan::factory()->menungguKonfirmasi()->create();

        $riwayat = RiwayatPermintaan::create([
            'id_permintaan' => $tiket->id,
            'id_user' => null,
            'status' => StatusPermintaan::Completed,
            'aksi' => AksiRiwayat::AutoClosed,
            'keterangan' => 'Ditutup otomatis setelah 3 hari kerja tanpa tinjauan.',
        ])->fresh();

        $this->assertNull($riwayat->pelaku);
        $this->assertSame(AksiRiwayat::AutoClosed, $riwayat->aksi);
        $this->assertCount(1, $tiket->riwayat);
    }

    public function test_peran_dan_status_akun_dipetakan_ke_enum(): void
    {
        $pic = User::factory()->pic()->create();

        $this->assertSame(Role::Pic, $pic->fresh()->role);
        $this->assertTrue($pic->isPic());
        $this->assertFalse($pic->isAdmin());
        $this->assertTrue($pic->isAktif());
        $this->assertFalse(User::factory()->nonaktif()->create()->isAktif());
    }

    public function test_pic_selalu_terikat_ke_satu_section(): void
    {
        $pic = User::factory()->pic()->create();

        $this->assertNotNull($pic->id_bagian);
        $this->assertSame($pic->id_bagian, $pic->bagian->id);
    }
}
