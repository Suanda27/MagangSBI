<?php

namespace Tests\Feature;

use App\Enums\StatusPermintaan;
use App\Models\Lantai;
use App\Models\Permintaan;
use App\Models\Plant;
use App\Models\User;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/**
 * Uji integrasi lintas peran lewat HTTP, dari pengajuan sampai selesai, ditolak, atau tutup otomatis.
 * Memastikan bagian-bagian yang diuji terpisah (hak akses, TicketWorkflow, notifikasi, Admin, laporan,
 * lampiran) benar-benar bekerja bersama.
 */
class AlurTiketLengkapTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    private Plant $plant;

    private Lantai $lantai;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake(FileUploadService::DISK);
        $this->siapkanSkenario();
        $this->plant = Plant::factory()->create();
        $this->lantai = Lantai::factory()->create(['id_plant' => $this->plant->id]);
    }

    // ---- Pembantu ------------------------------------------------------

    private function sebagai(User $akun): void
    {
        Sanctum::actingAs($akun);
    }

    /** Karyawan mengajukan tiket ke section IS dengan satu lampiran; mengembalikan datanya. */
    private function ajukan(?User $karyawan = null): array
    {
        $this->sebagai($karyawan ?? $this->karyawan);

        return $this->post('/api/employee/permintaan', [
            'id_layanan' => $this->layananIs->id,
            'id_plant' => $this->plant->id,
            'id_lantai' => $this->lantai->id,
            'judul' => 'Printer lantai dua macet',
            'deskripsi' => 'Printer di lantai dua macet dan tidak bisa mencetak.',
            'prioritas' => 'tinggi',
            'lampiran' => [UploadedFile::fake()->image('foto-printer.jpg')],
        ], ['Accept' => 'application/json'])->assertCreated()->json('data');
    }

    private function kirimHasil(int $id, string $catatan = 'Sudah diperbaiki')
    {
        return $this->post('/api/pic/permintaan/'.$id.'/kirim-hasil', [
            'catatan' => $catatan,
            'bukti' => [UploadedFile::fake()->image('bukti.png')],
        ], ['Accept' => 'application/json']);
    }

    private function belumDibaca(User $akun): int
    {
        $this->sebagai($akun);

        return $this->getJson('/api/notifikasi')->assertOk()->json('belum_dibaca');
    }

    /**
     * @return list<string> jenis kejadian notifikasi milik akun. Urutannya tidak dijadikan patokan: notifikasi yang
     *                      dibuat pada detik yang sama bernilai created_at sama.
     */
    private function aksiNotifikasi(User $akun): array
    {
        $this->sebagai($akun);

        return collect($this->getJson('/api/notifikasi')->assertOk()->json('data'))->pluck('aksi')->all();
    }

    // ---- Siklus penuh dengan satu revisi --------------------------------

    public function test_siklus_penuh_ajukan_terima_kirim_revisi_kirim_ulang_dan_setujui(): void
    {
        // 1. Karyawan mengajukan: nomor, section tujuan, dan status ditentukan server.
        $tiket = $this->ajukan();
        $id = $tiket['id'];
        $this->assertMatchesRegularExpression('/^IS-\d{4}-\d{4}$/', $tiket['kode_tiket']);
        $this->assertSame('submitted', $tiket['status']);

        // 2. Seluruh PIC section IS diberi tahu; PIC section lain tidak.
        $this->assertSame(1, $this->belumDibaca($this->picIs));
        $this->assertSame(1, $this->belumDibaca($this->picIs2));
        $this->assertSame(0, $this->belumDibaca($this->picGa));
        $this->assertSame(['submitted'], $this->aksiNotifikasi($this->picIs));

        // 3. Antrean dilihat PIC IS, tidak PIC GA; Admin melihat tiketnya di semua section.
        $this->sebagai($this->picIs);
        $this->getJson('/api/pic/dashboard')->assertOk()->assertJsonPath('data.antrean', 1);
        $this->sebagai($this->picGa);
        $this->getJson('/api/pic/dashboard')->assertOk()->assertJsonPath('data.antrean', 0);
        $this->getJson('/api/pic/permintaan/'.$id)->assertForbidden();
        $this->sebagai($this->admin);
        $this->getJson('/api/admin/permintaan')->assertOk()->assertJsonPath('ringkasan.per_status.submitted', 1);

        // 4. Lampiran pengajuan: pemilik dan PIC section boleh mengunduh, orang lain tidak.
        $lampiran = $tiket['lampiran'][0]['url'];
        $this->sebagai($this->karyawan);
        $this->get($lampiran)->assertOk();
        $this->sebagai($this->karyawanLain);
        $this->get($lampiran)->assertForbidden();
        $this->sebagai($this->picGa);
        $this->get($lampiran)->assertForbidden();

        // 5. PIC IS pertama menerima; PIC kedua kalah (409) dan tiket hilang dari antreannya.
        $this->sebagai($this->picIs);
        $this->postJson('/api/pic/permintaan/'.$id.'/terima')->assertOk()->assertJsonPath('data.status', 'in_progress');
        $this->sebagai($this->picIs2);
        $this->postJson('/api/pic/permintaan/'.$id.'/terima')->assertStatus(409);
        $this->getJson('/api/pic/dashboard')->assertJsonPath('data.antrean', 0);
        $this->assertSame(['accepted'], $this->aksiNotifikasi($this->karyawan));

        // 6. Tunda lalu lanjutkan; karyawan diberi tahu tiap kali.
        $this->sebagai($this->picIs);
        $this->postJson('/api/pic/permintaan/'.$id.'/status', ['status' => 'pending', 'alasan' => 'Menunggu tinta'])->assertOk();
        $this->postJson('/api/pic/permintaan/'.$id.'/status', ['status' => 'in_progress'])->assertOk();
        $this->assertEqualsCanonicalizing(['accepted', 'paused', 'resumed'], $this->aksiNotifikasi($this->karyawan));

        // 7. Kirim hasil pertama.
        $this->sebagai($this->picIs);
        $this->kirimHasil($id)->assertOk()->assertJsonPath('data.status', 'waiting_review');
        $this->assertContains('result_sent', $this->aksiNotifikasi($this->karyawan));

        // 8. Karyawan lain tidak bisa menanggapi; pengaju meminta revisi.
        $this->sebagai($this->karyawanLain);
        $this->postJson('/api/employee/permintaan/'.$id.'/setujui')->assertNotFound();
        $this->sebagai($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$id.'/revisi', ['alasan' => 'Masih macet di baki kedua'])
            ->assertOk()->assertJsonPath('data.status', 'in_progress')->assertJsonPath('data.jumlah_revisi', 1);
        $this->assertContains('revision_requested', $this->aksiNotifikasi($this->picIs));

        // 9. PIC kirim ulang (bukti putaran lama tetap ada), karyawan menyetujui.
        $this->sebagai($this->picIs);
        $this->kirimHasil($id, 'Baki kedua sudah dibersihkan')->assertOk()
            ->assertJsonCount(2, 'data.hasil_kerja.putaran');
        $this->sebagai($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$id.'/setujui')
            ->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertContains('approved', $this->aksiNotifikasi($this->picIs));

        // 10. Final: tidak bisa ditanggapi lagi, dan semua peran melihat hasil yang sama.
        $this->sebagai($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$id.'/setujui')->assertStatus(409);
        $this->sebagai($this->picIs);
        $this->getJson('/api/pic/permintaan?tab=selesai')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/pic/dashboard')->assertJsonPath('data.selesai', 1);
        $this->sebagai($this->supIs);
        $this->getJson('/api/supervisor/dashboard')->assertOk();

        // 11. Admin: pantauan, detail dengan seluruh riwayat, laporan, dan ekspor memuat tiket yang sama.
        $this->sebagai($this->admin);
        $this->getJson('/api/admin/permintaan/'.$id)->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.pic.id', $this->picIs->id)
            ->assertJsonPath('data.jumlah_revisi', 1);
        $laporan = $this->getJson('/api/admin/laporan')->assertOk()
            ->assertJsonPath('ringkasan.per_status.completed', 1)
            ->assertJsonPath('ringkasan.selesai.tanpa_revisi_persen', 0);
        $this->assertNotNull($laporan->json('ringkasan.selesai.rata_rata_jam'));
        $this->assertStringContainsString($tiket['kode_tiket'], $this->get('/api/admin/laporan/ekspor')->streamedContent());

        // 12. Riwayat lengkap dan berurutan tercatat di tiket.
        $aksi = collect($this->getJson('/api/admin/permintaan/'.$id)->json('data.riwayat'))->pluck('aksi')->all();
        $this->assertSame(
            ['submitted', 'accepted', 'paused', 'resumed', 'result_sent', 'revision_requested', 'result_sent', 'approved'],
            $aksi,
        );
    }

    // ---- Jalur ditolak -------------------------------------------------

    public function test_tiket_ditolak_pic_dilaporkan_ke_semua_pihak(): void
    {
        $tiket = $this->ajukan();
        $id = $tiket['id'];

        $this->sebagai($this->picIs);
        $this->postJson('/api/pic/permintaan/'.$id.'/tolak', ['alasan' => 'pendek'])->assertUnprocessable();
        $this->postJson('/api/pic/permintaan/'.$id.'/tolak', ['alasan' => 'Printer ditangani vendor, bukan IS'])
            ->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->assertSame(['rejected'], $this->aksiNotifikasi($this->karyawan));

        // Karyawan tidak bisa menyetujui tiket yang ditolak, dan melihat alasannya.
        $this->sebagai($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$id.'/setujui')->assertStatus(409);
        $this->getJson('/api/employee/permintaan/'.$id)->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.alasan_tolak', 'Printer ditangani vendor, bukan IS');

        // PIC rekan tidak lagi melihatnya di antrean; PIC yang menolak melihatnya di tab selesai.
        $this->sebagai($this->picIs2);
        $this->getJson('/api/pic/dashboard')->assertJsonPath('data.antrean', 0);
        $this->sebagai($this->picIs);
        $this->getJson('/api/pic/permintaan?tab=selesai')->assertOk()->assertJsonPath('data.0.status', 'rejected');

        $this->sebagai($this->admin);
        $this->getJson('/api/admin/laporan')->assertOk()->assertJsonPath('ringkasan.per_status.rejected', 1);
    }

    // ---- Tutup otomatis ------------------------------------------------

    public function test_tiket_tanpa_tanggapan_ditutup_otomatis_dan_kedua_pihak_diberi_tahu(): void
    {
        $tiket = $this->ajukan();
        $id = $tiket['id'];

        $this->sebagai($this->picIs);
        $this->postJson('/api/pic/permintaan/'.$id.'/terima')->assertOk();
        $this->kirimHasil($id)->assertOk();

        // Belum jatuh tempo: perintah tidak menyentuh tiket.
        $this->artisan('tiket:tutup-otomatis')->expectsOutputToContain('Ditutup: 0')->assertSuccessful();
        $this->assertSame(StatusPermintaan::WaitingReview, Permintaan::find($id)->status);

        // Enam hari kemudian (lebih dari 3 hari kerja): ditutup oleh Sistem.
        $this->travel(6)->days();
        $this->artisan('tiket:tutup-otomatis')->expectsOutputToContain('Ditutup: 1')->assertSuccessful();

        $this->assertSame(StatusPermintaan::Completed, Permintaan::find($id)->status);
        $this->assertContains('auto_closed', $this->aksiNotifikasi($this->karyawan));
        $this->assertContains('auto_closed', $this->aksiNotifikasi($this->picIs));

        $this->sebagai($this->admin);
        $riwayat = collect($this->getJson('/api/admin/permintaan/'.$id)->assertOk()->json('data.riwayat'));
        $this->assertSame('Sistem', $riwayat->last()['pelaku']);
        $this->getJson('/api/admin/laporan')->assertOk()->assertJsonPath('ringkasan.per_status.completed', 1);

        // Sesudah ditutup, karyawan tidak bisa lagi menanggapi.
        $this->sebagai($this->karyawan);
        $this->postJson('/api/employee/permintaan/'.$id.'/revisi', ['alasan' => 'Terlambat menanggapi'])->assertStatus(409);
    }

    // ---- Pemisahan data antar karyawan ---------------------------------

    public function test_karyawan_hanya_melihat_tiketnya_sendiri_di_seluruh_alur(): void
    {
        $milikku = $this->ajukan($this->karyawan);
        $milikLain = $this->ajukan($this->karyawanLain);

        $this->sebagai($this->karyawan);
        $this->getJson('/api/employee/permintaan')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $milikku['id']);
        $this->getJson('/api/employee/permintaan/'.$milikLain['id'])->assertNotFound();

        // Notifikasi pengajuan hanya ke PIC, bukan ke pengaju sendiri.
        $this->assertSame(0, $this->belumDibaca($this->karyawan));
        $this->assertSame(2, $this->belumDibaca($this->picIs));
    }
}
