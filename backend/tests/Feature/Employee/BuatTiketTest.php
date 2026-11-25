<?php

namespace Tests\Feature\Employee;

use App\Enums\AksiRiwayat;
use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Models\Bagian;
use App\Models\Lampiran;
use App\Models\Lantai;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\Plant;
use App\Models\RiwayatPermintaan;
use App\Models\UrutanTiket;
use App\Models\User;
use App\Services\FileUploadService;
use App\Services\TicketNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** POST /api/employee/permintaan. */
class BuatTiketTest extends TestCase
{
    use RefreshDatabase;

    private Bagian $ga;

    private Layanan $layanan;

    private Plant $plant;

    private Lantai $lantai;

    private User $karyawan;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(FileUploadService::DISK);

        $this->ga = Bagian::factory()->create(['kode_bagian' => 'GA']);
        $this->layanan = Layanan::factory()->create(['id_bagian' => $this->ga->id, 'kategori' => 'Fasilitas']);
        $this->plant = Plant::factory()->create();
        $this->lantai = Lantai::factory()->create(['id_plant' => $this->plant->id, 'nama_lantai' => 'Lantai 1']);
        // Karyawan berasal dari section lain, supaya terbukti tujuan tiket mengikuti layanan.
        $this->karyawan = User::factory()->employee(Bagian::factory()->create(['kode_bagian' => 'IS']))->create();
        Sanctum::actingAs($this->karyawan);
    }

    /** @return array<string, mixed> */
    private function data(array $ubah = []): array
    {
        return array_merge([
            'id_layanan' => $this->layanan->id,
            'id_plant' => $this->plant->id,
            'id_lantai' => $this->lantai->id,
            'lokasi_detail' => 'Dekat pantry',
            'judul' => 'AC ruang meeting bocor',
            'deskripsi' => 'AC di ruang meeting lantai 2 meneteskan air.',
            'prioritas' => 'tinggi',
        ], $ubah);
    }

    private function kirim(array $ubah = [])
    {
        return $this->postJson('/api/employee/permintaan', $this->data($ubah));
    }

    public function test_butuh_login_dan_hanya_untuk_karyawan(): void
    {
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/employee/permintaan', $this->data())->assertUnauthorized();

        Sanctum::actingAs(User::factory()->pic($this->ga)->create());
        $this->postJson('/api/employee/permintaan', $this->data())->assertForbidden();
    }

    public function test_membuat_tiket_dengan_nomor_otomatis_dan_status_submitted(): void
    {
        $tahun = now()->year;

        $this->kirim()
            ->assertCreated()
            ->assertJsonPath('data.kode_tiket', "GA-{$tahun}-0001")
            ->assertJsonPath('data.status', 'submitted')
            ->assertJsonPath('data.status_label', 'Diajukan')
            ->assertJsonPath('data.prioritas', 'tinggi')
            ->assertJsonPath('data.bagian.kode_bagian', 'GA')
            ->assertJsonPath('data.layanan.id', $this->layanan->id)
            ->assertJsonPath('data.lokasi.plant', $this->plant->nama_plant)
            ->assertJsonPath('data.lokasi.detail', 'Dekat pantry');

        $tiket = Permintaan::firstOrFail();
        $this->assertSame($this->karyawan->id, $tiket->id_karyawan);
        $this->assertSame($this->ga->id, $tiket->id_bagian);
        $this->assertNull($tiket->id_pic);
        $this->assertSame(StatusPermintaan::Submitted, $tiket->status);
    }

    public function test_nomor_tiket_berurutan(): void
    {
        $tahun = now()->year;
        $this->kirim()->assertCreated()->assertJsonPath('data.kode_tiket', "GA-{$tahun}-0001");
        $this->kirim()->assertCreated()->assertJsonPath('data.kode_tiket', "GA-{$tahun}-0002");
    }

    public function test_riwayat_pertama_tercatat(): void
    {
        $this->kirim()->assertCreated();

        $riwayat = RiwayatPermintaan::firstOrFail();
        $this->assertSame(AksiRiwayat::Submitted, $riwayat->aksi);
        $this->assertSame(StatusPermintaan::Submitted, $riwayat->status);
        $this->assertSame($this->karyawan->id, $riwayat->id_user);
    }

    public function test_prioritas_bawaan_normal(): void
    {
        $this->kirim(['prioritas' => null])->assertCreated()->assertJsonPath('data.prioritas', 'normal');
        $this->assertSame(Prioritas::Normal, Permintaan::firstOrFail()->prioritas);
    }

    public function test_kolom_yang_ditentukan_server_tidak_bisa_diisi_karyawan(): void
    {
        $pic = User::factory()->pic($this->ga)->create();
        $bagianLain = Bagian::factory()->create();

        $this->kirim([
            'kode_tiket' => 'XX-9999-0001',
            'id_bagian' => $bagianLain->id,
            'id_pic' => $pic->id,
            'id_karyawan' => 9999,
            'status' => 'completed',
            'jumlah_revisi' => 5,
        ])->assertCreated();

        $tiket = Permintaan::firstOrFail();
        $this->assertStringStartsWith('GA-', $tiket->kode_tiket);
        $this->assertSame($this->ga->id, $tiket->id_bagian);
        $this->assertNull($tiket->id_pic);
        $this->assertSame($this->karyawan->id, $tiket->id_karyawan);
        $this->assertSame(StatusPermintaan::Submitted, $tiket->status);
        $this->assertSame(0, $tiket->jumlah_revisi);
    }

    public function test_menyimpan_lampiran_dan_bisa_diunduh_pengaju(): void
    {
        $res = $this->post('/api/employee/permintaan', $this->data() + [
            'lampiran' => [UploadedFile::fake()->image('foto.jpg'), UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf')],
        ], ['Accept' => 'application/json'])->assertCreated();

        $res->assertJsonCount(2, 'data.lampiran');
        $this->assertSame(2, Lampiran::count());

        $id = $res->json('data.lampiran.0.id');
        $this->get('/api/lampiran/'.$id)->assertOk();
    }

    public function test_lampiran_ditolak_bila_format_salah_atau_lebih_dari_5(): void
    {
        $this->post('/api/employee/permintaan', $this->data() + [
            'lampiran' => [UploadedFile::fake()->create('virus.exe', 10)],
        ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('lampiran.0');

        $enam = array_map(fn ($i) => UploadedFile::fake()->image("f{$i}.jpg"), range(1, 6));
        $this->post('/api/employee/permintaan', $this->data() + ['lampiran' => $enam], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('lampiran');

        $this->assertSame(0, Permintaan::count());
    }

    public function test_kolom_wajib(): void
    {
        $this->postJson('/api/employee/permintaan', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['id_layanan', 'id_plant', 'id_lantai', 'judul', 'deskripsi']);
    }

    public function test_lokasi_wajib_dan_lantai_harus_milik_plant(): void
    {
        $this->kirim(['id_plant' => null])->assertUnprocessable()->assertJsonValidationErrors('id_plant');
        $this->kirim(['id_lantai' => null])->assertUnprocessable()->assertJsonValidationErrors('id_lantai');

        $plantLain = Plant::factory()->create();
        $this->kirim(['id_plant' => $plantLain->id])->assertUnprocessable()->assertJsonValidationErrors('id_lantai');
    }

    public function test_layanan_plant_dan_lantai_nonaktif_ditolak(): void
    {
        $nonaktif = Layanan::factory()->nonaktif()->create(['id_bagian' => $this->ga->id]);
        $this->kirim(['id_layanan' => $nonaktif->id])->assertUnprocessable()->assertJsonValidationErrors('id_layanan');

        $plantMati = Plant::factory()->nonaktif()->create();
        $lantaiDiPlantMati = Lantai::factory()->create(['id_plant' => $plantMati->id]);
        $this->kirim(['id_plant' => $plantMati->id, 'id_lantai' => $lantaiDiPlantMati->id])
            ->assertUnprocessable()->assertJsonValidationErrors('id_plant');

        $lantaiMati = Lantai::factory()->nonaktif()->create(['id_plant' => $this->plant->id, 'nama_lantai' => 'Lantai Nonaktif']);
        $this->kirim(['id_lantai' => $lantaiMati->id])->assertUnprocessable()->assertJsonValidationErrors('id_lantai');

        $this->assertSame(0, Permintaan::count());
    }

    public function test_batas_judul_deskripsi_dan_prioritas(): void
    {
        $this->kirim(['judul' => str_repeat('a', 151)])->assertUnprocessable()->assertJsonValidationErrors('judul');
        $this->kirim(['deskripsi' => 'pendek'])->assertUnprocessable()->assertJsonValidationErrors('deskripsi');
        $this->kirim(['prioritas' => 'darurat'])->assertUnprocessable()->assertJsonValidationErrors('prioritas');
        $this->kirim(['judul' => '   '])->assertUnprocessable()->assertJsonValidationErrors('judul');
    }

    public function test_gagal_di_tengah_jalan_membatalkan_semuanya(): void
    {
        // Lampiran bukan berkas sungguhan -> validasi lolos tidak mungkin, jadi paksa gagal lewat event bawaan.
        $generatorGagal = new class extends TicketNumberGenerator
        {
            public function generate(Bagian|int $bagian, ?int $tahun = null): string
            {
                parent::generate($bagian, $tahun);
                throw new \RuntimeException('simulasi gagal setelah nomor dibuat');
            }
        };
        $this->app->instance(TicketNumberGenerator::class, $generatorGagal);
        $this->withoutExceptionHandling();

        try {
            $this->post('/api/employee/permintaan', $this->data() + [
                'lampiran' => [UploadedFile::fake()->image('foto.jpg')],
            ], ['Accept' => 'application/json']);
            $this->fail('seharusnya gagal');
        } catch (\RuntimeException) {
            // diharapkan
        }

        $this->assertSame(0, Permintaan::count());
        $this->assertSame(0, RiwayatPermintaan::count());
        $this->assertSame(0, UrutanTiket::count(), 'nomor tiket harus ikut dibatalkan');
        $this->assertSame([], Storage::disk(FileUploadService::DISK)->allFiles());
    }

    public function test_event_tiket_diubah_dikirim_setelah_berhasil(): void
    {
        Event::fake([TiketDiubah::class]);

        $this->kirim()->assertCreated();

        Event::assertDispatched(TiketDiubah::class, fn ($e) => $e->aksi === AksiRiwayat::Submitted && $e->pelaku->is($this->karyawan));
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->karyawan->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->karyawan->fresh());

        $this->kirim()->assertForbidden();
        $this->assertSame(0, Permintaan::count());
    }
}
