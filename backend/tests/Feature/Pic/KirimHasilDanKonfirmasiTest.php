<?php

namespace Tests\Feature\Pic;

use App\Enums\AksiRiwayat;
use App\Enums\JenisLampiran;
use App\Enums\StatusPermintaan;
use App\Models\Lampiran;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** PIC kirim hasil, lalu karyawan setujui atau minta revisi (Sprint 3.3). */
class KirimHasilDanKonfirmasiTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
        Storage::fake(FileUploadService::DISK);
    }

    private function tiket(StatusPermintaan $status, array $tambah = []): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'id_pic' => $this->picIs->id,
            'status' => $status,
        ] + $tambah);
    }

    private function kirim(Permintaan $tiket, array $data = [])
    {
        return $this->post('/api/pic/permintaan/'.$tiket->id.'/kirim-hasil', $data, ['Accept' => 'application/json']);
    }

    private function bukti(int $jumlah = 1): array
    {
        return array_map(fn ($i) => UploadedFile::fake()->image("bukti{$i}.jpg"), range(1, $jumlah));
    }

    // ---- Kirim hasil ---------------------------------------------------

    public function test_pic_mengirim_hasil_dengan_bukti(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress);
        Sanctum::actingAs($this->picIs);

        $this->kirim($tiket, ['catatan' => 'Sudah diganti', 'bukti' => $this->bukti(2)])->assertOk()
            ->assertJsonPath('data.status', 'waiting_review')
            ->assertJsonPath('data.hasil_kerja.catatan', 'Sudah diganti')
            ->assertJsonCount(1, 'data.hasil_kerja.putaran')
            ->assertJsonCount(2, 'data.hasil_kerja.putaran.0.berkas')
            ->assertJsonPath('data.hasil_kerja.putaran.0.putaran', 1)
            ->assertJsonPath('data.lampiran', []);

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::WaitingReview, $tiket->status);
        $this->assertNotNull($tiket->dikirim_pada);
        $this->assertSame(2, Lampiran::where('id_permintaan', $tiket->id)->where('jenis', JenisLampiran::Penyelesaian)->count());
        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->where('aksi', AksiRiwayat::ResultSent)->count());
    }

    public function test_tiket_pending_boleh_langsung_dikirim_hasilnya(): void
    {
        $tiket = $this->tiket(StatusPermintaan::Pending, ['alasan_pending' => 'Menunggu suku cadang']);
        Sanctum::actingAs($this->picIs);

        $this->kirim($tiket, ['bukti' => $this->bukti()])->assertOk()->assertJsonPath('data.status', 'waiting_review');
        $this->assertNull($tiket->fresh()->alasan_pending);
    }

    public function test_bukti_wajib_minimal_satu_maksimal_lima_dan_format_sah_422(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress);
        Sanctum::actingAs($this->picIs);

        $this->kirim($tiket, [])->assertUnprocessable()->assertJsonValidationErrors('bukti');
        $this->kirim($tiket, ['bukti' => $this->bukti(6)])->assertUnprocessable()->assertJsonValidationErrors('bukti');
        $this->kirim($tiket, ['bukti' => [UploadedFile::fake()->create('virus.exe', 10)]])
            ->assertUnprocessable()->assertJsonValidationErrors('bukti.0');

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::InProgress, $tiket->status);
        $this->assertSame(0, Lampiran::where('id_permintaan', $tiket->id)->count());
    }

    public function test_hanya_pic_penanggung_jawab_yang_boleh_mengirim_hasil_403(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress);

        foreach ([$this->picIs2, $this->picGa] as $pic) {
            Sanctum::actingAs($pic);
            $this->kirim($tiket, ['bukti' => $this->bukti()])->assertForbidden();
        }

        foreach ([$this->karyawan, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->kirim($tiket, ['bukti' => $this->bukti()])->assertForbidden();
        }

        $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status);
        $this->assertSame(0, Lampiran::count());
    }

    public function test_kirim_hasil_pada_status_yang_salah_dijawab_409_tanpa_berkas_tersisa(): void
    {
        Sanctum::actingAs($this->picIs);

        foreach ([StatusPermintaan::WaitingReview, StatusPermintaan::Completed, StatusPermintaan::Submitted] as $status) {
            $tiket = $this->tiket($status, $status === StatusPermintaan::Submitted ? ['id_pic' => $this->picIs->id] : []);
            $this->kirim($tiket, ['bukti' => $this->bukti()])->assertStatus(409);
        }

        $this->assertSame(0, Lampiran::count());
        $this->assertSame([], Storage::disk(FileUploadService::DISK)->allFiles());
    }

    // ---- Setujui -------------------------------------------------------

    public function test_karyawan_menyetujui_hasil_dan_tiket_selesai(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        Sanctum::actingAs($this->karyawan);

        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.bisa_ditinjau', false);

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::Completed, $tiket->status);
        $this->assertNotNull($tiket->selesai_pada);
        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->where('aksi', AksiRiwayat::Approved)->count());
    }

    public function test_setujui_hanya_untuk_pengaju_dan_hanya_saat_menunggu_konfirmasi(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        $url = '/api/employee/permintaan/'.$tiket->id.'/setujui';

        $this->postJson($url)->assertUnauthorized();

        // Karyawan lain: tiket tidak terlihat (404), peran lain: 403.
        Sanctum::actingAs($this->karyawanLain);
        $this->postJson($url)->assertNotFound();
        foreach ([$this->picIs, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->postJson($url)->assertForbidden();
        }
        $this->assertSame(StatusPermintaan::WaitingReview, $tiket->fresh()->status);

        // Pengaju, tetapi status belum cocok: 409.
        Sanctum::actingAs($this->karyawan);
        foreach ([StatusPermintaan::InProgress, StatusPermintaan::Submitted, StatusPermintaan::Completed, StatusPermintaan::Rejected] as $status) {
            $lain = $this->tiket($status);
            $this->postJson('/api/employee/permintaan/'.$lain->id.'/setujui')->assertStatus(409);
        }
    }

    public function test_setujui_dua_kali_kedua_dijawab_409(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        Sanctum::actingAs($this->karyawan);

        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertOk();
        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertStatus(409);
        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->count());
    }

    // ---- Revisi --------------------------------------------------------

    public function test_karyawan_meminta_revisi_dan_tiket_kembali_diproses(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        Sanctum::actingAs($this->karyawan);

        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/revisi', ['alasan' => 'Printer masih macet di lantai dua'])->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.alasan_revisi', 'Printer masih macet di lantai dua')
            ->assertJsonPath('data.jumlah_revisi', 1);

        $this->assertSame($this->picIs->id, $tiket->fresh()->id_pic); // PIC yang sama melanjutkan
    }

    public function test_alasan_revisi_wajib_dan_minimal_10_karakter_422(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        Sanctum::actingAs($this->karyawan);
        $url = '/api/employee/permintaan/'.$tiket->id.'/revisi';

        $this->postJson($url)->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->postJson($url, ['alasan' => 'kurang'])->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->assertSame(StatusPermintaan::WaitingReview, $tiket->fresh()->status);
    }

    public function test_revisi_hanya_untuk_pengaju_dan_saat_menunggu_konfirmasi(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);
        $isi = ['alasan' => 'Belum sesuai harapan saya'];

        Sanctum::actingAs($this->karyawanLain);
        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/revisi', $isi)->assertNotFound();

        Sanctum::actingAs($this->picIs);
        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/revisi', $isi)->assertForbidden();

        Sanctum::actingAs($this->karyawan);
        $diproses = $this->tiket(StatusPermintaan::InProgress);
        $this->postJson('/api/employee/permintaan/'.$diproses->id.'/revisi', $isi)->assertStatus(409);
    }

    // ---- Siklus lengkap ------------------------------------------------

    public function test_siklus_revisi_tanpa_batas_dan_bukti_lama_tidak_hilang(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress);

        foreach ([1, 2, 3] as $putaran) {
            Sanctum::actingAs($this->picIs);
            $this->kirim($tiket, ['bukti' => $this->bukti($putaran)])->assertOk();

            Sanctum::actingAs($this->karyawan);
            $this->postJson('/api/employee/permintaan/'.$tiket->id.'/revisi', ['alasan' => "Revisi ke-{$putaran} belum pas"])->assertOk();
        }

        Sanctum::actingAs($this->picIs);
        $this->kirim($tiket, ['catatan' => 'Putaran akhir', 'bukti' => $this->bukti()])->assertOk();

        Sanctum::actingAs($this->karyawan);
        $res = $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.jumlah_revisi', 3)
            ->assertJsonCount(4, 'data.hasil_kerja.putaran');

        $this->assertSame([1, 2, 3, 4], collect($res->json('data.hasil_kerja.putaran'))->pluck('putaran')->all());
        $this->assertSame([1, 2, 3, 1], collect($res->json('data.hasil_kerja.putaran'))->map(fn ($p) => count($p['berkas']))->all());
    }

    public function test_tiket_selesai_tampil_di_tab_selesai_pic(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview);

        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$tiket->id.'/setujui')->assertOk();

        Sanctum::actingAs($this->picIs);
        $this->getJson('/api/pic/permintaan?tab=selesai')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'completed');
        $this->getJson('/api/pic/dashboard')->assertJsonPath('data.selesai', 1)->assertJsonPath('data.menunggu_konfirmasi', 0);
    }
}
