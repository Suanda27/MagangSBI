<?php

namespace Tests\Feature\Auth;

use App\Enums\Role;
use App\Enums\StatusAkun;
use App\Models\Bagian;
use App\Models\User;
use Database\Seeders\BagianSeeder;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/** API registrasi akun mandiri: POST /api/auth/register. */
class RegisterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(BagianSeeder::class);
    }

    /** @return array<string, mixed> */
    private function payload(array $override = []): array
    {
        return array_merge([
            'name' => 'Syifa Fitria Azizah',
            'nik' => 'EMP-2023-0842',
            'email' => 'syifa@sbi.co.id',
            'section' => 'IS',
            'password' => 'Enterprise@2026',
            'password_confirmation' => 'Enterprise@2026',
        ], $override);
    }

    public function test_karyawan_bisa_daftar_dengan_kode_section(): void
    {
        $res = $this->postJson('/api/auth/register', $this->payload());

        $res->assertCreated()
            ->assertJsonPath('data.email', 'syifa@sbi.co.id')
            ->assertJsonPath('data.role', 'employee')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.bagian.kode_bagian', 'IS')
            ->assertJsonMissingPath('data.password');

        $user = User::firstWhere('email', 'syifa@sbi.co.id');
        $this->assertSame(Role::Employee, $user->role);
        $this->assertTrue(Hash::check('Enterprise@2026', $user->password));
    }

    public function test_bisa_daftar_dengan_id_bagian(): void
    {
        $id = Bagian::where('kode_bagian', 'PE')->value('id');

        $this->postJson('/api/auth/register', $this->payload(['section' => null, 'id_bagian' => $id]))
            ->assertCreated()
            ->assertJsonPath('data.bagian.id', $id);
    }

    public function test_nama_field_dan_section_dari_frontend_diterima(): void
    {
        // Form frontend: fullName, confirmPassword, dan section "Assembly" (kode di DB: ASM).
        $this->postJson('/api/auth/register', [
            'fullName' => 'Faiz Suanda',
            'nik' => 'emp-2023-0001',
            'email' => 'FAIZ@sbi.co.id',
            'section' => 'Assembly',
            'password' => 'Enterprise@2026',
            'confirmPassword' => 'Enterprise@2026',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Faiz Suanda')
            ->assertJsonPath('data.nik', 'EMP-2023-0001')    // dinormalisasi huruf besar
            ->assertJsonPath('data.email', 'faiz@sbi.co.id')  // dinormalisasi huruf kecil
            ->assertJsonPath('data.bagian.kode_bagian', 'ASM');
    }

    public function test_role_dan_status_tidak_bisa_diisi_dari_request(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['role' => 'admin', 'status' => 'nonaktif']))
            ->assertCreated();

        $user = User::firstWhere('email', 'syifa@sbi.co.id');
        $this->assertSame(Role::Employee, $user->role);
        $this->assertSame(StatusAkun::Aktif, $user->status);
    }

    public function test_role_selalu_employee_walau_konfigurasi_diubah(): void
    {
        // PRD D9: Supervisor, PIC, dan Admin hanya diberikan Admin. Tidak ada opsi config/.env
        // yang boleh menaikkan role pendaftar mandiri, bahkan bila seseorang mencoba mengisinya.
        foreach (['admin', 'supervisor', 'pic'] as $role) {
            config(['register.default_role' => $role]);

            $this->postJson('/api/auth/register', $this->payload([
                'nik' => 'EMP-'.$role,
                'email' => $role.'@sbi.co.id',
            ]))->assertCreated()->assertJsonPath('data.role', 'employee');
        }

        $this->assertSame(0, User::where('role', '!=', Role::Employee->value)->count());
    }

    public function test_status_tidak_sah_pada_konfigurasi_kembali_ke_aktif(): void
    {
        config(['register.default_status' => 'entah']);

        $this->postJson('/api/auth/register', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'aktif');
    }

    public function test_field_wajib_divalidasi(): void
    {
        $this->postJson('/api/auth/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'nik', 'email', 'password', 'section']);
    }

    public function test_nik_dan_email_ganda_ditolak(): void
    {
        User::factory()->create(['nik' => 'EMP-2023-0842', 'email' => 'syifa@sbi.co.id']);

        $this->postJson('/api/auth/register', $this->payload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nik', 'email'])
            ->assertJsonPath('errors.nik.0', 'NIK ini sudah terdaftar di sistem.')
            ->assertJsonPath('errors.email.0', 'Email ini sudah digunakan.');
    }

    public function test_format_nik_tidak_valid_ditolak(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['nik' => '!!']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nik']);
    }

    public function test_kata_sandi_harus_dikonfirmasi_dan_cukup_panjang(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['password_confirmation' => 'beda']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.password.0', 'Konfirmasi kata sandi tidak cocok.');

        $this->postJson('/api/auth/register', $this->payload(['password' => 'short', 'password_confirmation' => 'short']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_section_tidak_dikenal_ditolak(): void
    {
        $this->postJson('/api/auth/register', $this->payload(['section' => 'XX']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['section']);
    }

    public function test_section_nonaktif_tidak_bisa_dipilih(): void
    {
        Bagian::where('kode_bagian', 'IS')->update(['status' => StatusAkun::Nonaktif]);

        $this->postJson('/api/auth/register', $this->payload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['section']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_domain_email_bisa_dibatasi_lewat_konfigurasi(): void
    {
        config(['register.allowed_email_domains' => ['sbi.co.id']]);

        $this->postJson('/api/auth/register', $this->payload(['email' => 'x@gmail.com']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->postJson('/api/auth/register', $this->payload())->assertCreated();
    }

    public function test_event_registered_dikirim_untuk_ekstensi(): void
    {
        Event::fake([Registered::class]);

        $this->postJson('/api/auth/register', $this->payload())->assertCreated();

        Event::assertDispatched(Registered::class, fn ($e) => $e->user->email === 'syifa@sbi.co.id');
    }

    public function test_endpoint_section_hanya_menampilkan_section_aktif(): void
    {
        Bagian::where('kode_bagian', 'GA')->update(['status' => StatusAkun::Nonaktif]);

        $this->getJson('/api/referensi/sections')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonStructure(['data' => [['id', 'kode_bagian', 'nama_bagian', 'deskripsi']]]);
    }

    public function test_cors_mengizinkan_asal_frontend(): void
    {
        $this->withHeaders(['Origin' => 'http://localhost:3000'])
            ->postJson('/api/auth/register', [])
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }
}
