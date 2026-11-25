<?php

namespace Tests\Feature;

use App\Enums\AksiRiwayat;
use App\Enums\StatusPermintaan;
use App\Events\TiketDiubah;
use App\Models\Permintaan;
use App\Models\User;
use App\Notifications\TiketDiperbarui;
use App\Services\TicketWorkflow;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\MembuatSkenarioTiket;
use Tests\TestCase;

/** Notifikasi dalam aplikasi: siapa yang diberi tahu (PRD 4.3) dan API-nya. */
class NotifikasiTest extends TestCase
{
    use MembuatSkenarioTiket;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->siapkanSkenario();
    }

    private function tiket(StatusPermintaan $status = StatusPermintaan::Submitted, ?User $pic = null): Permintaan
    {
        return Permintaan::factory()->create([
            'id_layanan' => $this->layananIs->id,
            'id_karyawan' => $this->karyawan->id,
            'status' => $status,
            'id_pic' => $pic?->id,
        ]);
    }

    private function kirim(Permintaan $tiket, AksiRiwayat $aksi, ?User $pelaku): void
    {
        TiketDiubah::dispatch($tiket, $aksi, $pelaku);
    }

    /** @return list<int> id akun yang menerima notifikasi */
    private function penerima(): array
    {
        $id = DatabaseNotification::query()->pluck('notifiable_id')->map(fn ($v) => (int) $v)->sort()->values()->all();

        return $id;
    }

    /** @param list<User> $akun @return list<int> */
    private function ids(array $akun): array
    {
        return collect($akun)->pluck('id')->sort()->values()->all();
    }

    // ---- Siapa yang diberi tahu ---------------------------------------

    public function test_tiket_baru_diberitahukan_ke_semua_pic_aktif_section_tujuan(): void
    {
        $picNonaktif = User::factory()->pic($this->bagianIs)->nonaktif()->create();
        $tiket = $this->tiket();

        $this->kirim($tiket, AksiRiwayat::Submitted, $this->karyawan);

        $this->assertSame($this->ids([$this->picIs, $this->picIs2]), $this->penerima());
        $this->assertNotContains($picNonaktif->id, $this->penerima(), 'PIC nonaktif dilewati');
        $this->assertNotContains($this->picGa->id, $this->penerima(), 'PIC section lain tidak diberi tahu');
        $this->assertNotContains($this->supIs->id, $this->penerima(), 'supervisor tidak menerima notifikasi');
        $this->assertNotContains($this->karyawan->id, $this->penerima(), 'pelaku tidak diberi tahu');
    }

    public function test_pelaku_tidak_menerima_notifikasi_atas_tindakannya_sendiri(): void
    {
        $this->kirim($this->tiket(), AksiRiwayat::Submitted, $this->picIs);

        $this->assertSame($this->ids([$this->picIs2]), $this->penerima());
    }

    /** @return array<string, array{AksiRiwayat}> */
    public static function aksiUntukPengaju(): array
    {
        return [
            'diterima' => [AksiRiwayat::Accepted],
            'ditolak' => [AksiRiwayat::Rejected],
            'ditunda' => [AksiRiwayat::Paused],
            'dilanjutkan' => [AksiRiwayat::Resumed],
            'hasil dikirim' => [AksiRiwayat::ResultSent],
        ];
    }

    #[DataProvider('aksiUntukPengaju')]
    public function test_aksi_pic_diberitahukan_ke_karyawan_pengaju_saja(AksiRiwayat $aksi): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, $this->picIs);

        $this->kirim($tiket, $aksi, $this->picIs);

        $this->assertSame($this->ids([$this->karyawan]), $this->penerima());
    }

    /** @return array<string, array{AksiRiwayat}> */
    public static function aksiUntukPic(): array
    {
        return ['revisi diminta' => [AksiRiwayat::RevisionRequested], 'hasil disetujui' => [AksiRiwayat::Approved]];
    }

    #[DataProvider('aksiUntukPic')]
    public function test_tanggapan_karyawan_diberitahukan_ke_pic_penanggung_jawab_saja(AksiRiwayat $aksi): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview, $this->picIs);

        $this->kirim($tiket, $aksi, $this->karyawan);

        $this->assertSame($this->ids([$this->picIs]), $this->penerima(), 'PIC lain di section yang sama tidak ikut');
    }

    public function test_tanggapan_karyawan_pada_tiket_tanpa_pic_tidak_menimbulkan_error(): void
    {
        $this->kirim($this->tiket(), AksiRiwayat::RevisionRequested, $this->karyawan);

        $this->assertSame([], $this->penerima());
    }

    public function test_tutup_otomatis_diberitahukan_ke_pengaju_dan_pic(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview, $this->picIs);

        $this->kirim($tiket, AksiRiwayat::AutoClosed, null);

        $this->assertSame($this->ids([$this->karyawan, $this->picIs]), $this->penerima());
    }

    public function test_akun_nonaktif_tidak_diberi_notifikasi(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, $this->picIs);
        $this->karyawan->update(['status' => 'nonaktif']);

        $this->kirim($tiket, AksiRiwayat::Accepted, $this->picIs);

        $this->assertSame([], $this->penerima());
    }

    public function test_isi_notifikasi(): void
    {
        $tiket = $this->tiket(StatusPermintaan::InProgress, $this->picIs);
        $tiket->forceFill(['judul' => 'AC bocor'])->save();

        $this->kirim($tiket, AksiRiwayat::Accepted, $this->picIs);

        $data = DatabaseNotification::query()->firstOrFail()->data;
        $this->assertSame('accepted', $data['aksi']);
        $this->assertSame('Permintaan Diterima', $data['judul']);
        $this->assertSame($tiket->id, $data['id_permintaan']);
        $this->assertSame($tiket->kode_tiket, $data['kode_tiket']);
        $this->assertStringContainsString($tiket->kode_tiket, $data['pesan']);
        $this->assertStringContainsString($this->picIs->name, $data['pesan']);

        DatabaseNotification::query()->delete();
        $this->kirim($tiket, AksiRiwayat::AutoClosed, null);
        $this->assertStringContainsString('ditutup otomatis oleh sistem', DatabaseNotification::query()->firstOrFail()->data['pesan']);
    }

    // ---- Terhubung dengan TicketWorkflow -------------------------------

    public function test_pic_menerima_tiket_memberi_notifikasi_ke_pengaju(): void
    {
        $tiket = $this->tiket();

        app(TicketWorkflow::class)->terima($tiket, $this->picIs);

        $this->assertSame($this->ids([$this->karyawan]), $this->penerima());
        $this->assertSame('accepted', DatabaseNotification::query()->firstOrFail()->data['aksi']);
    }

    public function test_karyawan_menyetujui_hasil_memberi_notifikasi_ke_pic(): void
    {
        $tiket = $this->tiket(StatusPermintaan::WaitingReview, $this->picIs);

        app(TicketWorkflow::class)->setujui($tiket, $this->karyawan);

        $this->assertSame($this->ids([$this->picIs]), $this->penerima());
        $this->assertSame('approved', DatabaseNotification::query()->firstOrFail()->data['aksi']);
    }

    public function test_kegagalan_notifikasi_tidak_menggagalkan_perubahan_status(): void
    {
        $this->mock(Dispatcher::class, fn ($mock) => $mock->shouldReceive('send')->andThrow(new \RuntimeException('notifikasi rusak')));
        $tiket = $this->tiket();

        app(TicketWorkflow::class)->terima($tiket, $this->picIs);

        $this->assertSame(StatusPermintaan::InProgress, $tiket->fresh()->status, 'status tetap tersimpan');
    }

    // ---- API -----------------------------------------------------------

    private function buat(User $akun, int $jumlah = 1, ?string $waktu = null, bool $dibaca = false): void
    {
        foreach (range(1, $jumlah) as $i) {
            $tiket = $this->tiket(StatusPermintaan::InProgress, $this->picIs);
            $tiket->forceFill(['judul' => "Tiket {$i}"])->save();
            $akun->notify(new TiketDiperbarui($tiket, AksiRiwayat::Accepted, $this->picIs->name));
        }

        if ($waktu !== null || $dibaca) {
            $akun->notifications()->update(array_filter([
                'created_at' => $waktu,
                'read_at' => $dibaca ? now() : null,
            ]));
        }
    }

    public function test_api_butuh_login_dan_terbuka_untuk_semua_peran(): void
    {
        $this->getJson('/api/notifikasi')->assertUnauthorized();
        $this->postJson('/api/notifikasi/baca', ['semua' => true])->assertUnauthorized();

        foreach ([$this->karyawan, $this->picIs, $this->supIs, $this->admin] as $akun) {
            Sanctum::actingAs($akun);
            $this->getJson('/api/notifikasi')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('belum_dibaca', 0);
        }
    }

    public function test_akun_nonaktif_ditolak(): void
    {
        $this->karyawan->update(['status' => 'nonaktif']);
        Sanctum::actingAs($this->karyawan->fresh());

        $this->getJson('/api/notifikasi')->assertForbidden();
    }

    public function test_hanya_notifikasi_milik_sendiri_dengan_bentuk_yang_benar(): void
    {
        $this->buat($this->karyawan);
        $this->buat($this->karyawanLain, 2);

        Sanctum::actingAs($this->karyawan);
        $res = $this->getJson('/api/notifikasi')->assertOk();

        $res->assertJsonCount(1, 'data')->assertJsonPath('belum_dibaca', 1)
            ->assertJsonPath('data.0.aksi', 'accepted')
            ->assertJsonPath('data.0.judul', 'Permintaan Diterima')
            ->assertJsonPath('data.0.dibaca', false)
            ->assertJsonPath('data.0.dibaca_pada', null)
            ->assertJsonStructure(['data' => [['id', 'aksi', 'judul', 'pesan', 'id_permintaan', 'kode_tiket', 'dibaca', 'dibaca_pada', 'dibuat_pada']], 'meta', 'links', 'belum_dibaca']);
    }

    public function test_terbaru_dulu_filter_belum_dibaca_dan_jumlah_tidak_terpengaruh_filter(): void
    {
        $this->buat($this->karyawan, 2);
        [$lama, $baru] = $this->karyawan->notifications()->get()->all();
        $baru->forceFill(['created_at' => now()])->save();
        $lama->forceFill(['created_at' => now()->subDays(2), 'read_at' => now()])->save();

        Sanctum::actingAs($this->karyawan);

        $semua = $this->getJson('/api/notifikasi')->assertOk();
        $this->assertSame([$baru->id, $lama->id], array_column($semua->json('data'), 'id'));

        $this->getJson('/api/notifikasi?belum_dibaca=1')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $baru->id)
            ->assertJsonPath('belum_dibaca', 1);
    }

    public function test_paginasi_dan_validasi_query(): void
    {
        $this->buat($this->karyawan, 12);
        Sanctum::actingAs($this->karyawan);

        $this->getJson('/api/notifikasi')->assertOk()->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 12)->assertJsonPath('belum_dibaca', 12);
        $this->getJson('/api/notifikasi?page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/notifikasi?per_page=5')->assertOk()->assertJsonCount(5, 'data');
        $this->getJson('/api/notifikasi?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        $this->getJson('/api/notifikasi?belum_dibaca=mungkin')->assertUnprocessable()->assertJsonValidationErrors('belum_dibaca');
    }

    public function test_tandai_dibaca_beberapa_id(): void
    {
        $this->buat($this->karyawan, 3);
        $ids = $this->karyawan->notifications()->pluck('id')->all();

        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/notifikasi/baca', ['ids' => [$ids[0], $ids[1]]])
            ->assertOk()->assertJsonPath('data.diubah', 2)->assertJsonPath('data.belum_dibaca', 1);

        $this->assertNotNull(DatabaseNotification::find($ids[0])->read_at);
        $this->assertNull(DatabaseNotification::find($ids[2])->read_at);

        // Mengulang tidak mengubah apa pun.
        $this->postJson('/api/notifikasi/baca', ['ids' => [$ids[0]]])->assertOk()->assertJsonPath('data.diubah', 0);
    }

    public function test_tandai_semua_dibaca_hanya_milik_sendiri(): void
    {
        $this->buat($this->karyawan, 2);
        $this->buat($this->karyawanLain, 2);

        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/notifikasi/baca', ['semua' => true])
            ->assertOk()->assertJsonPath('data.diubah', 2)->assertJsonPath('data.belum_dibaca', 0);

        $this->assertSame(2, $this->karyawanLain->unreadNotifications()->count(), 'milik orang lain tidak tersentuh');
    }

    public function test_id_milik_orang_lain_diabaikan(): void
    {
        $this->buat($this->karyawanLain, 1);
        $milikLain = $this->karyawanLain->notifications()->firstOrFail();

        Sanctum::actingAs($this->karyawan);
        $this->postJson('/api/notifikasi/baca', ['ids' => [$milikLain->id]])->assertOk()->assertJsonPath('data.diubah', 0);

        $this->assertNull($milikLain->fresh()->read_at);
    }

    public function test_validasi_tandai_dibaca(): void
    {
        Sanctum::actingAs($this->karyawan);

        $this->postJson('/api/notifikasi/baca', [])->assertUnprocessable();
        $this->postJson('/api/notifikasi/baca', ['semua' => true, 'ids' => ['b5f0c3a2-8f2d-4c1a-9a9b-3f1f6f0a1b2c']])->assertUnprocessable();
        $this->postJson('/api/notifikasi/baca', ['ids' => ['bukan-uuid']])->assertUnprocessable()->assertJsonValidationErrors('ids.0');
        $this->postJson('/api/notifikasi/baca', ['semua' => false])->assertUnprocessable();
    }
}
