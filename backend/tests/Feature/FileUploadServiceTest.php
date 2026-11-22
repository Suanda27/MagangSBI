<?php

namespace Tests\Feature;

use App\Enums\JenisLampiran;
use App\Models\Lampiran;
use App\Models\Pengaturan;
use App\Models\Permintaan;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/** Penyimpanan lampiran di disk privat dan aturan validasinya. */
class FileUploadServiceTest extends TestCase
{
    use RefreshDatabase;

    private FileUploadService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(FileUploadService::DISK);
        $this->service = app(FileUploadService::class);
    }

    private function valid(array $berkas): bool
    {
        return ! Validator::make(['lampiran' => $berkas], $this->service->aturan())->fails();
    }

    public function test_menyimpan_berkas_di_disk_privat_dan_mencatat_di_database(): void
    {
        $tiket = Permintaan::factory()->create();
        $pengaju = User::find($tiket->id_karyawan);

        $hasil = $this->service->simpan($tiket, $pengaju, [
            UploadedFile::fake()->image('foto.jpg'),
            UploadedFile::fake()->create('laporan.pdf', 100, 'application/pdf'),
        ]);

        $this->assertCount(2, $hasil);
        $this->assertSame(2, Lampiran::count());

        foreach ($hasil as $lampiran) {
            Storage::disk(FileUploadService::DISK)->assertExists($lampiran->path_file);
            $this->assertStringStartsWith('lampiran/'.$tiket->id.'/', $lampiran->path_file);
            $this->assertSame(JenisLampiran::Pengajuan, $lampiran->jenis);
            $this->assertNull($lampiran->putaran);
            $this->assertSame($pengaju->id, $lampiran->id_user);
        }

        $this->assertSame(['foto.jpg', 'laporan.pdf'], $hasil->pluck('nama_file')->all());
        $this->assertStringNotContainsString('foto', $hasil[0]->path_file, 'nama di disk harus diacak');
    }

    public function test_berkas_penyelesaian_mencatat_putaran(): void
    {
        $tiket = Permintaan::factory()->create();
        $pic = User::factory()->pic($tiket->id_bagian)->create();

        $hasil = $this->service->simpan($tiket, $pic, [UploadedFile::fake()->image('bukti.png')], JenisLampiran::Penyelesaian, 2);

        $this->assertSame(JenisLampiran::Penyelesaian, $hasil[0]->jenis);
        $this->assertSame(2, $hasil[0]->putaran);
    }

    public function test_nama_asli_dibersihkan_dari_folder(): void
    {
        $tiket = Permintaan::factory()->create();
        $pengaju = User::find($tiket->id_karyawan);

        $hasil = $this->service->simpan($tiket, $pengaju, [UploadedFile::fake()->image('../../etc/foto.png')]);

        $this->assertSame('foto.png', $hasil[0]->nama_file);
    }

    public function test_berkas_fisik_dihapus_bila_gagal_di_tengah_jalan(): void
    {
        $tiket = Permintaan::factory()->create();
        $pengaju = User::find($tiket->id_karyawan);

        // Berkas kedua bukan UploadedFile sungguhan, sehingga proses gagal setelah berkas pertama tersimpan.
        try {
            $this->service->simpan($tiket, $pengaju, (function () {
                yield UploadedFile::fake()->image('a.jpg');
                throw new \RuntimeException('putus di tengah');
            })());
            $this->fail('seharusnya melempar error');
        } catch (\RuntimeException) {
            // diharapkan
        }

        $this->assertSame([], Storage::disk(FileUploadService::DISK)->allFiles());
    }

    public function test_hapus_fisik_membersihkan_berkas(): void
    {
        $tiket = Permintaan::factory()->create();
        $hasil = $this->service->simpan($tiket, User::find($tiket->id_karyawan), [UploadedFile::fake()->image('a.jpg')]);

        $this->service->hapusFisik($hasil);

        Storage::disk(FileUploadService::DISK)->assertMissing($hasil[0]->path_file);
    }

    public function test_validasi_menerima_jpg_png_pdf_dan_lampiran_boleh_kosong(): void
    {
        $this->assertTrue($this->valid([
            UploadedFile::fake()->image('a.jpg'),
            UploadedFile::fake()->image('b.png'),
            UploadedFile::fake()->create('c.pdf', 50, 'application/pdf'),
        ]));
        $this->assertTrue(! Validator::make([], $this->service->aturan())->fails());
    }

    public function test_validasi_menolak_format_lain(): void
    {
        $this->assertFalse($this->valid([UploadedFile::fake()->create('a.docx', 10)]));
        $this->assertFalse($this->valid([UploadedFile::fake()->create('a.exe', 10)]));
        $this->assertFalse($this->valid([UploadedFile::fake()->create('a.php', 10)]));
    }

    public function test_validasi_menolak_lebih_dari_5_berkas(): void
    {
        $this->assertTrue($this->valid(array_map(fn ($i) => UploadedFile::fake()->image("f{$i}.jpg"), range(1, 5))));
        $this->assertFalse($this->valid(array_map(fn ($i) => UploadedFile::fake()->image("f{$i}.jpg"), range(1, 6))));
    }

    public function test_validasi_batas_ukuran_mengikuti_pengaturan(): void
    {
        Pengaturan::simpan('max_upload_mb', 2);

        $this->assertTrue($this->valid([UploadedFile::fake()->create('ok.pdf', 2048, 'application/pdf')]));
        $this->assertFalse($this->valid([UploadedFile::fake()->create('besar.pdf', 2049, 'application/pdf')]));
    }

    public function test_format_mengikuti_pengaturan_dan_format_berbahaya_tidak_pernah_diizinkan(): void
    {
        Pengaturan::simpan('format_lampiran', 'png,php,exe');

        $this->assertSame(['png'], $this->service->formatDiizinkan());
        $this->assertTrue($this->valid([UploadedFile::fake()->image('a.png')]));
        $this->assertFalse($this->valid([UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]));
    }
}
