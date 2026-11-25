<?php

namespace Tests\Feature\Pic;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Models\Permintaan;
use App\Models\RiwayatPermintaan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** POST /api/pic/permintaan/{id}/terima, /tolak, dan /status. */
class AksiPermintaanPicTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, array $tambah = [], bool $untukGa = false): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => ($untukGa ? $this->layananGa : $this->layananIs)->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
        ] + $tambah);
    }

    private function url(Permintaan $tiket, string $aksi): string
    {
        return '/api/pic/permintaan/'.$tiket->id.'/'.$aksi;
    }

    // ---- Hak akses -----------------------------------------------------

    public function test_butuh_login_dan_hanya_untuk_pic(): void
    {
        $tiket = $this->tiket();

        foreach (['terima', 'tolak', 'status'] as $aksi) {
            $this->postJson($this->url($tiket, $aksi))->assertUnauthorized();
        }

        foreach ([$this->karyawan, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            foreach (['terima', 'tolak', 'status'] as $aksi) {
                $this->postJson($this->url($tiket, $aksi))->assertForbidden();
            }
        }

        $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
    }

    // ---- Terima --------------------------------------------------------

    public function test_pic_section_tujuan_menerima_tiket(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'terima'), ['catatan' => 'Segera dikerjakan'])->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.status_label', 'Sedang Diproses')
            ->assertJsonPath('data.pic.id', $this->picIs->id)
            ->assertJsonPath('data.riwayat.0.aksi', AksiRiwayat::Accepted->value);

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::InProgress, $tiket->status);
        $this->assertSame($this->picIs->id, $tiket->id_pic);
        $this->assertNotNull($tiket->diterima_pada);
        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->where('aksi', AksiRiwayat::Accepted)->count());
    }

    public function test_menerima_tanpa_catatan_boleh(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'terima'))->assertOk()->assertJsonPath('data.status', 'in_progress');
    }

    public function test_pic_kedua_yang_menerima_tiket_sama_dijawab_409(): void
    {
        $tiket = $this->tiket();

        Sanctum::actingAs($this->picIs);
        $this->postJson($this->url($tiket, 'terima'))->assertOk();

        Sanctum::actingAs($this->picIs2);
        $this->postJson($this->url($tiket, 'terima'))->assertStatus(409);
        $this->postJson($this->url($tiket, 'tolak'), ['alasan' => 'Alasan yang cukup panjang'])->assertStatus(409);

        $this->assertSame($this->picIs->id, $tiket->fresh()->id_pic);
        $this->assertSame(1, RiwayatPermintaan::where('id_permintaan', $tiket->id)->count());
    }

    public function test_pic_section_lain_tidak_boleh_menerima_403(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picGa);

        $this->postJson($this->url($tiket, 'terima'))->assertForbidden();
        $this->postJson($this->url($tiket, 'tolak'), ['alasan' => 'Alasan yang cukup panjang'])->assertForbidden();

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::Submitted, $tiket->status);
        $this->assertNull($tiket->id_pic);
    }

    public function test_tiket_tidak_ada_dijawab_404(): void
    {
        Sanctum::actingAs($this->picIs);

        $this->postJson('/api/pic/permintaan/999999/terima')->assertNotFound();
    }

    // ---- Tolak ---------------------------------------------------------

    public function test_pic_menolak_tiket_dengan_alasan(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'tolak'), ['alasan' => 'Di luar cakupan layanan section ini'])->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.alasan_tolak', 'Di luar cakupan layanan section ini');

        $tiket->refresh();
        $this->assertSame(StatusPermintaan::Rejected, $tiket->status);
        $this->assertSame($this->picIs->id, $tiket->id_pic);
        $this->assertNotNull($tiket->ditolak_pada);
    }

    public function test_alasan_tolak_wajib_dan_minimal_10_karakter_422(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'tolak'))->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->postJson($this->url($tiket, 'tolak'), ['alasan' => 'pendek'])->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->postJson($this->url($tiket, 'tolak'), ['alasan' => str_repeat('a', 1001)])->assertUnprocessable()->assertJsonValidationErrors('alasan');

        $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
    }

    // ---- Tunda / lanjutkan --------------------------------------------

    public function test_pic_penanggung_jawab_menunda_lalu_melanjutkan(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'status'), ['status' => 'pending', 'alasan' => 'Menunggu suku cadang'])->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.alasan_pending', 'Menunggu suku cadang');

        $this->postJson($this->url($tiket, 'status'), ['status' => 'in_progress'])->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.alasan_pending', null);

        $this->assertSame(
            [AksiRiwayat::Paused, AksiRiwayat::Resumed],
            RiwayatPermintaan::where('id_permintaan', $tiket->id)->orderBy('id')->get()->pluck('aksi')->all(),
        );
    }

    public function test_menunda_butuh_alasan_422(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'status'), ['status' => 'pending'])->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->postJson($this->url($tiket, 'status'), ['status' => 'pending', 'alasan' => 'abc'])->assertUnprocessable()->assertJsonValidationErrors('alasan');
        $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status);
    }

    public function test_status_tujuan_selain_pending_atau_in_progress_ditolak_422(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        Sanctum::actingAs($this->picIs);

        foreach (['completed', 'waiting_review', 'rejected', 'ngawur'] as $tujuan) {
            $this->postJson($this->url($tiket, 'status'), ['status' => $tujuan, 'alasan' => 'Alasan yang cukup'])
                ->assertUnprocessable()->assertJsonValidationErrors('status');
        }
        $this->postJson($this->url($tiket, 'status'))->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_pic_lain_tidak_boleh_mengubah_status_tiket_rekan_403(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);

        foreach ([$this->picIs2, $this->picGa] as $pic) {
            Sanctum::actingAs($pic);
            $this->postJson($this->url($tiket, 'status'), ['status' => 'pending', 'alasan' => 'Alasan yang cukup'])->assertForbidden();
        }

        $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status);
    }

    public function test_transisi_tidak_valid_dijawab_409(): void
    {
        Sanctum::actingAs($this->picIs);

        // Lanjutkan, padahal tiket sudah Diproses (bukan Pending).
        $diproses = $this->tiket(StatusPermintaan::InProgress, ['id_pic' => $this->picIs->id]);
        $this->postJson($this->url($diproses, 'status'), ['status' => 'in_progress'])->assertStatus(409);

        // Tunda tiket yang sudah Pending.
        $pending = $this->tiket(StatusPermintaan::Pending, ['id_pic' => $this->picIs->id]);
        $this->postJson($this->url($pending, 'status'), ['status' => 'pending', 'alasan' => 'Alasan yang cukup'])->assertStatus(409);

        // Tiket final tidak bisa diubah lagi.
        $selesai = $this->tiket(StatusPermintaan::Completed, ['id_pic' => $this->picIs->id]);
        $this->postJson($this->url($selesai, 'status'), ['status' => 'pending', 'alasan' => 'Alasan yang cukup'])->assertStatus(409);
    }

    public function test_tiket_hasil_terima_langsung_tampil_di_tab_diproses(): void
    {
        $tiket = $this->tiket();
        Sanctum::actingAs($this->picIs);

        $this->postJson($this->url($tiket, 'terima'))->assertOk();

        $this->getJson('/api/pic/permintaan?tab=masuk')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/pic/permintaan?tab=diproses')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.kode_tiket', $tiket->kode_tiket);
    }
}
