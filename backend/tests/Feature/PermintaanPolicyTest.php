<?php

namespace Tests\Feature;

use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** PermintaanPolicy: siapa boleh melihat dan memproses tiket (PRD 4.4). */
class PermintaanPolicyTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    // ---- Melihat tiket ------------------------------------------------

    public function test_karyawan_hanya_melihat_tiketnya_sendiri(): void
    {
        $tiket = $this->tiketIs();

        $this->assertTrue($this->karyawan->can('view', $tiket));
        $this->assertFalse($this->karyawanLain->can('view', $tiket));
    }

    public function test_pic_melihat_antrean_section_sendiri_saja(): void
    {
        $tiketIs = $this->tiketIs();

        $this->assertTrue($this->picIs->can('view', $tiketIs));
        $this->assertTrue($this->picIs2->can('view', $tiketIs));
        $this->assertFalse($this->picGa->can('view', $tiketIs), 'PIC GA tidak boleh melihat tiket IS');
    }

    public function test_setelah_diambil_hanya_pic_penanggung_jawab_yang_melihat(): void
    {
        $tiket = Permintaan::factory()->dalamProses($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        $this->assertTrue($this->picIs->can('view', $tiket));
        $this->assertFalse($this->picIs2->can('view', $tiket), 'PIC lain se-section tidak melihat tiket yang sudah diambil');
    }

    public function test_supervisor_melihat_tiket_yang_masuk_ke_section_tujuannya(): void
    {
        $tiket = $this->tiketIs();   // pengaju dari GA, tujuan IS

        $this->assertTrue($this->supIs->can('view', $tiket), 'Supervisor IS melihat tiket yang masuk ke IS');
        $this->assertFalse($this->supGa->can('view', $tiket), 'Supervisor GA tidak melihat tiket yang hanya diajukan dari GA');
    }

    public function test_admin_melihat_semua_tiket(): void
    {
        $this->assertTrue($this->admin->can('view', $this->tiketIs()));
        $this->assertTrue($this->admin->can('view', $this->tiketGa()));
    }

    // ---- Terima / tolak ----------------------------------------------

    public function test_hanya_pic_section_tujuan_boleh_menerima_dan_menolak(): void
    {
        $tiket = $this->tiketIs();

        foreach (['terima', 'tolak'] as $aksi) {
            $this->assertTrue($this->picIs->can($aksi, $tiket), "PIC IS boleh {$aksi}");
            $this->assertTrue($this->picIs2->can($aksi, $tiket), "PIC IS lain boleh {$aksi}");
            $this->assertFalse($this->picGa->can($aksi, $tiket), "PIC GA tidak boleh {$aksi} tiket IS");
            $this->assertFalse($this->supIs->can($aksi, $tiket), "Supervisor tidak boleh {$aksi}");
            $this->assertFalse($this->admin->can($aksi, $tiket), "Admin tidak boleh {$aksi}");
            $this->assertFalse($this->karyawan->can($aksi, $tiket), "Karyawan tidak boleh {$aksi}");
        }
    }

    public function test_policy_terima_tidak_memeriksa_status_agar_konflik_dijawab_409_bukan_403(): void
    {
        $diambil = Permintaan::factory()->dalamProses($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        // PIC IS lain masih "berhak" secara peran/section. Penolakannya (409) urusan TicketWorkflow.
        $this->assertTrue($this->picIs2->can('terima', $diambil));
    }

    // ---- Mengubah status dan mengirim hasil ---------------------------

    public function test_hanya_pic_penanggung_jawab_boleh_mengubah_status_dan_mengirim_hasil(): void
    {
        $tiket = Permintaan::factory()->dalamProses($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        foreach (['ubahStatus', 'kirimHasil'] as $aksi) {
            $this->assertTrue($this->picIs->can($aksi, $tiket), "PIC penanggung jawab boleh {$aksi}");
            $this->assertFalse($this->picIs2->can($aksi, $tiket), "PIC lain se-section tidak boleh {$aksi}");
            $this->assertFalse($this->picGa->can($aksi, $tiket), "PIC section lain tidak boleh {$aksi}");
            $this->assertFalse($this->karyawan->can($aksi, $tiket), "Karyawan tidak boleh {$aksi}");
            $this->assertFalse($this->admin->can($aksi, $tiket), "Admin tidak boleh {$aksi}");
        }
    }

    // ---- Menyetujui / meminta revisi ---------------------------------

    public function test_hanya_karyawan_pengaju_boleh_menyetujui_dan_meminta_revisi(): void
    {
        $tiket = Permintaan::factory()->menungguKonfirmasi($this->picIs)->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
        ]);

        foreach (['setujui', 'mintaRevisi'] as $aksi) {
            $this->assertTrue($this->karyawan->can($aksi, $tiket), "Pengaju boleh {$aksi}");
            $this->assertFalse($this->karyawanLain->can($aksi, $tiket), "Karyawan lain tidak boleh {$aksi}");
            $this->assertFalse($this->picIs->can($aksi, $tiket), "PIC tidak boleh {$aksi}");
            $this->assertFalse($this->supIs->can($aksi, $tiket), "Supervisor tidak boleh {$aksi}");
            $this->assertFalse($this->admin->can($aksi, $tiket), "Admin tidak boleh {$aksi}");
        }
    }

    // ---- Lampiran dan akun nonaktif ----------------------------------

    public function test_unduh_lampiran_mengikuti_aturan_melihat_tiket(): void
    {
        $tiket = $this->tiketIs();

        $this->assertTrue($this->karyawan->can('unduhLampiran', $tiket));
        $this->assertTrue($this->picIs->can('unduhLampiran', $tiket));
        $this->assertFalse($this->karyawanLain->can('unduhLampiran', $tiket));
        $this->assertFalse($this->picGa->can('unduhLampiran', $tiket));
    }

    public function test_akun_nonaktif_ditolak_untuk_semua_aksi(): void
    {
        $tiket = $this->tiketIs();
        $picNonaktif = User::factory()->pic($this->bagianIs)->nonaktif()->create();
        $pengajuNonaktif = User::factory()->employee($this->bagianGa)->nonaktif()->create();
        $tiketNonaktif = Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $pengajuNonaktif->id,
        ]);

        foreach (['view', 'terima', 'tolak', 'ubahStatus', 'kirimHasil', 'unduhLampiran'] as $aksi) {
            $this->assertFalse($picNonaktif->can($aksi, $tiket), "PIC nonaktif tidak boleh {$aksi}");
        }
        $this->assertFalse($pengajuNonaktif->can('view', $tiketNonaktif), 'Pengaju nonaktif tidak boleh melihat tiketnya sendiri');
    }
}
