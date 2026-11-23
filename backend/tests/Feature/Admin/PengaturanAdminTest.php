<?php

namespace Tests\Feature\Admin;

use App\Models\Pengaturan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** /api/admin/pengaturan — batas ukuran dan format lampiran (PRD D11). */
class PengaturanAdminTest extends TestCase
{
    use MembuatSkenarioTiket, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function sebagaiAdmin(): void
    {
        Sanctum::actingAs($this->admin);
    }

    public function test_hanya_admin_yang_boleh(): void
    {
        $this->getJson('/api/admin/pengaturan')->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs] as $pengguna) {
            Sanctum::actingAs($pengguna);
            $this->getJson('/api/admin/pengaturan')->assertForbidden();
            $this->patchJson('/api/admin/pengaturan', ['max_upload_mb' => 2])->assertForbidden();
        }
    }

    public function test_menampilkan_nilai_bawaan_bila_belum_ada_di_database(): void
    {
        $this->sebagaiAdmin();

        $this->getJson('/api/admin/pengaturan')->assertOk()
            ->assertExactJson(['data' => [
                'max_upload_mb' => 5,
                'format_lampiran' => ['jpg', 'png', 'pdf'],
                'digit_nomor_tiket' => 4,
                'maks_berkas' => 5,
            ]]);
    }

    public function test_menampilkan_nilai_dari_tabel_pengaturan(): void
    {
        $this->sebagaiAdmin();
        Pengaturan::simpan('max_upload_mb', 3);
        Pengaturan::simpan('format_lampiran', 'png,pdf');

        $this->getJson('/api/admin/pengaturan')->assertOk()
            ->assertJsonPath('data.max_upload_mb', 3)
            ->assertJsonPath('data.format_lampiran', ['png', 'pdf']);
    }

    public function test_mengubah_ukuran_dan_format_lalu_dipakai_form_pengajuan(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson('/api/admin/pengaturan', ['max_upload_mb' => 2, 'format_lampiran' => ['PDF', ' jpg ']])
            ->assertOk()
            ->assertJsonPath('message', 'Pengaturan berhasil disimpan.')
            ->assertJsonPath('data.max_upload_mb', 2)
            ->assertJsonPath('data.format_lampiran', ['jpg', 'pdf']); // urutan tetap, huruf kecil

        $this->assertSame('2', Pengaturan::ambil('max_upload_mb'));
        $this->assertSame('jpg,pdf', Pengaturan::ambil('format_lampiran'));

        // Form pengajuan (milik Syifa) membaca tabel yang sama.
        Sanctum::actingAs($this->karyawan);
        $this->getJson('/api/referensi/aturan-lampiran')->assertOk()
            ->assertJsonPath('data.maks_ukuran_mb', 2)
            ->assertJsonPath('data.format', ['jpg', 'pdf']);
    }

    public function test_boleh_mengirim_sebagian_kunci(): void
    {
        $this->sebagaiAdmin();
        Pengaturan::simpan('format_lampiran', 'png');

        $this->patchJson('/api/admin/pengaturan', ['max_upload_mb' => 4])->assertOk()
            ->assertJsonPath('data.max_upload_mb', 4)
            ->assertJsonPath('data.format_lampiran', ['png']);
    }

    public function test_validasi_pengaturan(): void
    {
        $this->sebagaiAdmin();

        foreach ([0, 6, 99, 'abc', 2.5] as $buruk) {
            $this->patchJson('/api/admin/pengaturan', ['max_upload_mb' => $buruk])
                ->assertUnprocessable()->assertJsonValidationErrors('max_upload_mb');
        }

        $this->patchJson('/api/admin/pengaturan', ['format_lampiran' => []])
            ->assertUnprocessable()->assertJsonValidationErrors('format_lampiran');
        $this->patchJson('/api/admin/pengaturan', ['format_lampiran' => ['exe']])
            ->assertUnprocessable()->assertJsonValidationErrors('format_lampiran.0');
        $this->patchJson('/api/admin/pengaturan', ['format_lampiran' => ['pdf', 'pdf']])
            ->assertUnprocessable()->assertJsonValidationErrors('format_lampiran.0');
        $this->patchJson('/api/admin/pengaturan', ['format_lampiran' => 'jpg,png'])
            ->assertUnprocessable()->assertJsonValidationErrors('format_lampiran');

        $this->assertNull(Pengaturan::ambil('max_upload_mb')); // tidak ada yang tersimpan
    }

    public function test_format_nomor_tiket_tidak_dapat_diubah(): void
    {
        $this->sebagaiAdmin();

        $this->patchJson('/api/admin/pengaturan', ['digit_nomor_tiket' => 6])
            ->assertUnprocessable()->assertJsonValidationErrors('digit_nomor_tiket');
    }
}
