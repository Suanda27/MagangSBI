<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tiket permintaan layanan (PRD Bagian 5).
 *
 * - id_bagian  = section TUJUAN (disalin dari layanan saat tiket dibuat), dipakai untuk
 *                antrean PIC dan cakupan Supervisor.
 * - id_pic     = PIC penanggung jawab; kosong sampai ada PIC yang menerima.
 * - status     : submitted | in_progress | pending | waiting_review | completed | rejected
 * - prioritas  : normal | tinggi | mendesak (hanya label pengurut antrean, tanpa SLA)
 * Tiket tidak pernah dihapus, jadi seluruh relasi memakai restrictOnDelete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permintaans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_tiket', 30)->unique();

            $table->foreignId('id_karyawan')->constrained('users')->restrictOnDelete();
            $table->foreignId('id_layanan')->constrained('layanans')->restrictOnDelete();
            $table->foreignId('id_bagian')->constrained('bagians')->restrictOnDelete();
            $table->foreignId('id_pic')->nullable()->constrained('users')->restrictOnDelete();

            $table->foreignId('id_plant')->constrained('plants')->restrictOnDelete();
            $table->foreignId('id_lantai')->constrained('lantais')->restrictOnDelete();
            $table->string('lokasi_detail')->nullable();

            $table->string('judul', 150);
            $table->text('deskripsi');
            $table->string('prioritas', 10)->default('normal');
            $table->string('status', 20)->default('submitted');

            $table->timestamp('diterima_pada')->nullable();
            $table->timestamp('ditolak_pada')->nullable();
            $table->timestamp('dikirim_pada')->nullable();   // hasil kerja terakhir dikirim (dasar tutup otomatis)
            $table->timestamp('selesai_pada')->nullable();
            $table->unsignedSmallInteger('jumlah_revisi')->default(0);

            $table->text('alasan_tolak')->nullable();
            $table->text('alasan_pending')->nullable();
            $table->text('alasan_revisi')->nullable();       // alasan revisi terakhir
            $table->text('catatan_hasil')->nullable();       // catatan PIC pada kiriman terakhir

            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
            $table->index(['id_bagian', 'status']);          // antrean section
            $table->index(['id_pic', 'status']);             // tiket yang ditangani PIC
            $table->index(['id_karyawan', 'status']);        // tiket milik karyawan
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permintaans');
    }
};
