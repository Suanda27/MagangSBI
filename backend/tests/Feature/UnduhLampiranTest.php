<?php

namespace Tests\Feature;

use App\Models\Lampiran;
use App\Models\Permintaan;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** GET /api/lampiran/{id}: hanya yang berhak melihat tiketnya. */
class UnduhLampiranTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    private Permintaan $tiket;

    private Lampiran $lampiran;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(FileUploadService::DISK);
        $this->siapkanSkenario();

        $this->tiket = $this->tiketIs(); // milik $karyawan, tujuan section IS
        $this->lampiran = app(FileUploadService::class)
            ->simpan($this->tiket, $this->karyawan, [UploadedFile::fake()->image('bukti.png')])
            ->first();
    }

    public function test_butuh_login(): void
    {
        $this->getJson('/api/lampiran/'.$this->lampiran->id)->assertUnauthorized();
    }

    public function test_pengaju_bisa_mengunduh_dengan_nama_asli(): void
    {
        Sanctum::actingAs($this->karyawan);

        $res = $this->get('/api/lampiran/'.$this->lampiran->id)->assertOk();

        $this->assertStringContainsString('bukti.png', $res->headers->get('Content-Disposition'));
        $this->assertSame('nosniff', $res->headers->get('X-Content-Type-Options'));
    }

    public function test_pic_dan_supervisor_section_tujuan_serta_admin_bisa_mengunduh(): void
    {
        foreach ([$this->picIs, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->get('/api/lampiran/'.$this->lampiran->id)->assertOk();
        }
    }

    public function test_karyawan_lain_dan_section_lain_ditolak(): void
    {
        foreach ([$this->karyawanLain, $this->picGa, $this->supGa] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson('/api/lampiran/'.$this->lampiran->id)->assertForbidden();
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->karyawan->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->karyawan->fresh());

        $this->getJson('/api/lampiran/'.$this->lampiran->id)->assertForbidden();
    }

    public function test_lampiran_tidak_ada_atau_berkas_hilang_memberi_404(): void
    {
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/lampiran/999999')->assertNotFound();

        Storage::disk(FileUploadService::DISK)->delete($this->lampiran->path_file);
        $this->getJson('/api/lampiran/'.$this->lampiran->id)->assertNotFound();
    }
}
