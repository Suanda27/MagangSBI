<?php

namespace Tests\Feature;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Exceptions\TiketSudahDiambil;
use App\Exceptions\TransisiTidakValid;
use App\Models\Permintaan;
use App\Services\TicketWorkflow;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** TicketWorkflow: terima, tolak, ubah status (Sprint 1) dan pemetaannya ke kode HTTP. */
class TicketWorkflowTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    private TicketWorkflow $workflow;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
        $this->workflow = app(TicketWorkflow::class);
    }

    private function tiketDiprosesPicIs(): Permintaan
    {
        return Permintaan::factory()->dalamProses($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);
    }

    // ---- Terima -------------------------------------------------------

    public function test_terima_menjadikan_pic_penanggung_jawab_dan_menulis_riwayat(): void
    {
        Event::fake([TiketDiubah::class]);
        $tiket = $this->tiketIs();

        $hasil = $this->workflow->terima($tiket, $this->picIs, 'Akan dicek besok pagi.');

        $this->assertSame(StatusPermintaan::InProgress, $hasil->status);
        $this->assertSame($this->picIs->id, $hasil->id_pic);
        $this->assertNotNull($hasil->diterima_pada);

        $riwayat = $hasil->riwayat;
        $this->assertCount(1, $riwayat);
        $this->assertSame(AksiRiwayat::Accepted, $riwayat[0]->aksi);
        $this->assertSame($this->picIs->id, $riwayat[0]->id_user);
        $this->assertSame('Akan dicek besok pagi.', $riwayat[0]->keterangan);

        Event::assertDispatched(TiketDiubah::class, fn (TiketDiubah $e) => $e->aksi === AksiRiwayat::Accepted
            && $e->permintaan->is($tiket) && $e->pelaku?->is($this->picIs));
    }

    public function test_pic_kedua_yang_menerima_tiket_yang_sama_ditolak_dengan_409(): void
    {
        $tiket = $this->tiketIs();
        $salinanPicKedua = Permintaan::find($tiket->id);   // PIC kedua masih memegang data lama ("masih baru")

        $this->workflow->terima($tiket, $this->picIs);

        try {
            $this->workflow->terima($salinanPicKedua, $this->picIs2);
            $this->fail('PIC kedua seharusnya ditolak');
        } catch (TiketSudahDiambil $e) {
            $this->assertSame(409, $e->getStatusCode());
        }

        $this->assertSame($this->picIs->id, $tiket->fresh()->id_pic, 'Penanggung jawab tetap PIC pertama');
        $this->assertCount(1, $tiket->riwayat, 'Penerimaan yang gagal tidak menulis riwayat');
    }

    public function test_pic_section_lain_tidak_bisa_menerima(): void
    {
        $tiket = $this->tiketIs();

        $this->expectException(AuthorizationException::class);
        try {
            $this->workflow->terima($tiket, $this->picGa);
        } finally {
            $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
            $this->assertNull($tiket->fresh()->id_pic);
        }
    }

    public function test_bukan_pic_tidak_bisa_menerima(): void
    {
        $this->expectException(AuthorizationException::class);
        $this->workflow->terima($this->tiketIs(), $this->supIs);
    }

    // ---- Tolak --------------------------------------------------------

    public function test_tolak_mencatat_alasan_dan_pic_yang_menolak(): void
    {
        $tiket = $this->tiketIs();

        $hasil = $this->workflow->tolak($tiket, $this->picIs, 'Di luar cakupan layanan IS.');

        $this->assertSame(StatusPermintaan::Rejected, $hasil->status);
        $this->assertSame($this->picIs->id, $hasil->id_pic);
        $this->assertSame('Di luar cakupan layanan IS.', $hasil->alasan_tolak);
        $this->assertNotNull($hasil->ditolak_pada);
        $this->assertSame(AksiRiwayat::Rejected, $hasil->riwayat->last()->aksi);
    }

    public function test_tolak_dengan_alasan_terlalu_pendek_ditolak_422(): void
    {
        $tiket = $this->tiketIs();

        try {
            $this->workflow->tolak($tiket, $this->picIs, 'tidak');
            $this->fail('Seharusnya gagal validasi');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('alasan', $e->errors());
        }

        $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
    }

    public function test_tiket_yang_sudah_diterima_tidak_bisa_ditolak_lagi(): void
    {
        $tiket = $this->tiketIs();
        $this->workflow->terima($tiket, $this->picIs);

        $this->expectException(TiketSudahDiambil::class);
        $this->workflow->tolak(Permintaan::find($tiket->id), $this->picIs2, 'Alasan penolakan yang cukup panjang.');
    }

    // ---- Ubah status --------------------------------------------------

    public function test_menunda_dan_melanjutkan_mencatat_alasan_dan_riwayat(): void
    {
        $tiket = $this->tiketDiprosesPicIs();

        $ditunda = $this->workflow->ubahStatus($tiket, $this->picIs, StatusPermintaan::Pending, 'Menunggu sparepart dari vendor.');
        $this->assertSame(StatusPermintaan::Pending, $ditunda->status);
        $this->assertSame('Menunggu sparepart dari vendor.', $ditunda->alasan_pending);

        $dilanjutkan = $this->workflow->ubahStatus($ditunda, $this->picIs, StatusPermintaan::InProgress, 'Sparepart sudah tiba.');
        $this->assertSame(StatusPermintaan::InProgress, $dilanjutkan->status);
        $this->assertNull($dilanjutkan->alasan_pending, 'Alasan pending dihapus saat dilanjutkan');

        $this->assertEquals(
            [AksiRiwayat::Paused, AksiRiwayat::Resumed],
            $dilanjutkan->riwayat->pluck('aksi')->all(),
        );
    }

    public function test_menunda_tanpa_alasan_yang_cukup_ditolak_422(): void
    {
        $this->expectException(ValidationException::class);
        $this->workflow->ubahStatus($this->tiketDiprosesPicIs(), $this->picIs, StatusPermintaan::Pending, 'ya');
    }

    public function test_pic_lain_tidak_bisa_mengubah_status_tiket_yang_bukan_miliknya(): void
    {
        $tiket = $this->tiketDiprosesPicIs();

        try {
            $this->workflow->ubahStatus($tiket, $this->picIs2, StatusPermintaan::Pending, 'Alasan penundaan cukup.');
            $this->fail('Seharusnya ditolak');
        } catch (AuthorizationException) {
            $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status);
        }
    }

    public function test_perpindahan_status_yang_tidak_valid_ditolak_409(): void
    {
        $tiket = $this->tiketDiprosesPicIs();

        // Sedang diproses → sedang diproses (tidak ada perubahan)
        $this->assertTransisiDitolak(fn () => $this->workflow->ubahStatus($tiket, $this->picIs, StatusPermintaan::InProgress));
        // Tidak boleh langsung selesai atau kembali ke antrean lewat ubahStatus
        $this->assertTransisiDitolak(fn () => $this->workflow->ubahStatus($tiket, $this->picIs, StatusPermintaan::Completed));
        $this->assertTransisiDitolak(fn () => $this->workflow->ubahStatus($tiket, $this->picIs, StatusPermintaan::Submitted));

        $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status);
        $this->assertCount(0, $tiket->riwayat, 'Perpindahan yang ditolak tidak menulis riwayat');
    }

    public function test_tiket_menunggu_konfirmasi_tidak_bisa_ditunda_oleh_pic(): void
    {
        $tiket = Permintaan::factory()->menungguKonfirmasi($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        $this->expectException(TransisiTidakValid::class);
        $this->workflow->ubahStatus($tiket, $this->picIs, StatusPermintaan::Pending, 'Alasan penundaan cukup.');
    }

    private function assertTransisiDitolak(callable $aksi): void
    {
        try {
            $aksi();
            $this->fail('Seharusnya ditolak dengan TransisiTidakValid');
        } catch (TransisiTidakValid $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
    }

    // ---- Pemetaan ke kode HTTP (403 vs 409 vs 422) ---------------------

    private function daftarkanRouteUji(): void
    {
        Route::middleware(['api', 'auth:sanctum', 'akun.aktif', 'role:pic'])
            ->prefix('api/_uji')
            ->group(function () {
                Route::post('/terima/{permintaan}', function (Permintaan $permintaan, TicketWorkflow $workflow) {
                    Gate::authorize('terima', $permintaan);   // 403 bila bukan hak pelaku

                    return $workflow->terima($permintaan, auth()->user());   // 409 bila keadaan sudah berubah
                });

                Route::post('/tolak/{permintaan}', function (Permintaan $permintaan, TicketWorkflow $workflow) {
                    Gate::authorize('tolak', $permintaan);

                    return $workflow->tolak($permintaan, auth()->user(), (string) request('alasan'));
                });
            });
    }

    public function test_http_pic_yang_berhak_menerima_dengan_200(): void
    {
        $this->daftarkanRouteUji();
        $tiket = $this->tiketIs();
        Sanctum::actingAs($this->picIs);

        $this->postJson("/api/_uji/terima/{$tiket->id}")
            ->assertOk()
            ->assertJsonPath('status', 'in_progress')
            ->assertJsonPath('id_pic', $this->picIs->id);
    }

    public function test_http_pic_section_lain_dijawab_403(): void
    {
        $this->daftarkanRouteUji();
        $tiket = $this->tiketIs();
        Sanctum::actingAs($this->picGa);

        $this->postJson("/api/_uji/terima/{$tiket->id}")->assertForbidden();
        $this->assertSame(StatusPermintaan::Submitted, $tiket->fresh()->status);
    }

    public function test_http_penerimaan_ganda_dijawab_409_untuk_pic_kedua(): void
    {
        $this->daftarkanRouteUji();
        $tiket = $this->tiketIs();

        Sanctum::actingAs($this->picIs);
        $this->postJson("/api/_uji/terima/{$tiket->id}")->assertOk();

        Sanctum::actingAs($this->picIs2);
        $this->postJson("/api/_uji/terima/{$tiket->id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Tiket ini sudah diambil atau diproses oleh PIC lain.');

        $this->assertSame($this->picIs->id, $tiket->fresh()->id_pic);
    }

    public function test_http_alasan_tolak_terlalu_pendek_dijawab_422(): void
    {
        $this->daftarkanRouteUji();
        $tiket = $this->tiketIs();
        Sanctum::actingAs($this->picIs);

        $this->postJson("/api/_uji/tolak/{$tiket->id}", ['alasan' => 'tidak'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('alasan');
    }

    public function test_http_karyawan_tidak_bisa_memanggil_route_pic(): void
    {
        $this->daftarkanRouteUji();
        $tiket = $this->tiketIs();
        Sanctum::actingAs($this->karyawan);

        $this->postJson("/api/_uji/terima/{$tiket->id}")->assertForbidden();
    }
}
