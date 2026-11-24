<?php

namespace Tests\Feature\Employee;

use App\Enums\StatusPermintaan;
use App\Models\Bagian;
use App\Models\Layanan;
use App\Models\Permintaan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** GET /api/employee/dashboard. */
class DashboardKaryawanTest extends TestCase
{
    use RefreshDatabase;

    private function tiket(User $pengaju, StatusPermintaan $status = StatusPermintaan::Submitted, ?Layanan $layanan = null): Permintaan
    {
        return Permintaan::factory()->create([
            'id_karyawan' => $pengaju->id,
            'id_layanan' => ($layanan ?? Layanan::factory()->create())->id,
            'status' => $status,
        ]);
    }

    public function test_butuh_login_dan_hanya_untuk_karyawan(): void
    {
        $this->getJson('/api/employee/dashboard')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->supervisor(Bagian::factory()->create())->create());
        $this->getJson('/api/employee/dashboard')->assertForbidden();
    }

    public function test_dashboard_kosong_memberi_nol_untuk_semua_status(): void
    {
        Sanctum::actingAs(User::factory()->employee(Bagian::factory()->create())->create());

        $this->getJson('/api/employee/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total', 0)
            ->assertJsonPath('data.berjalan', 0)
            ->assertJsonPath('data.per_status', [
                'submitted' => 0, 'in_progress' => 0, 'pending' => 0,
                'waiting_review' => 0, 'completed' => 0, 'rejected' => 0,
            ])
            ->assertJsonCount(0, 'data.terbaru');
    }

    public function test_menghitung_per_status_hanya_tiket_sendiri(): void
    {
        $saya = User::factory()->employee(Bagian::factory()->create())->create();
        $lain = User::factory()->employee(Bagian::factory()->create())->create();

        $this->tiket($saya, StatusPermintaan::Submitted);
        $this->tiket($saya, StatusPermintaan::Submitted);
        $this->tiket($saya, StatusPermintaan::Completed);
        $this->tiket($saya, StatusPermintaan::Rejected);
        $this->tiket($lain, StatusPermintaan::Submitted); // tidak boleh terhitung

        Sanctum::actingAs($saya);

        $this->getJson('/api/employee/dashboard')
            ->assertOk()
            ->assertJsonPath('data.total', 4)
            ->assertJsonPath('data.berjalan', 2)
            ->assertJsonPath('data.per_status.submitted', 2)
            ->assertJsonPath('data.per_status.completed', 1)
            ->assertJsonPath('data.per_status.rejected', 1)
            ->assertJsonPath('data.per_status.in_progress', 0);
    }

    public function test_menampilkan_5_tiket_terbaru_milik_sendiri(): void
    {
        $saya = User::factory()->employee(Bagian::factory()->create())->create();
        $lain = User::factory()->employee(Bagian::factory()->create())->create();

        $semua = [];
        foreach (range(1, 7) as $i) {
            $semua[$i] = $this->tiket($saya);
            $semua[$i]->forceFill(['created_at' => now()->subMinutes(10 - $i)])->save();
        }
        $this->tiket($lain);

        Sanctum::actingAs($saya);

        $res = $this->getJson('/api/employee/dashboard')->assertOk()->assertJsonCount(5, 'data.terbaru');

        $this->assertSame(
            [$semua[7]->id, $semua[6]->id, $semua[5]->id, $semua[4]->id, $semua[3]->id],
            array_column($res->json('data.terbaru'), 'id'),
        );
        $res->assertJsonPath('data.terbaru.0.kode_tiket', $semua[7]->kode_tiket)
            ->assertJsonStructure(['data' => ['terbaru' => [['id', 'kode_tiket', 'judul', 'status', 'status_label', 'layanan', 'bagian']]]]);
    }
}
