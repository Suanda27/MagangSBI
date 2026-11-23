<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Satu baris per perubahan status tiket. Sumber timeline dan riwayat.
 * id_user kosong = kejadian oleh Sistem (mis. ditutup otomatis).
 * aksi membedakan kejadian yang statusnya sama (mis. revision_requested vs resumed).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_permintaans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_permintaan')->constrained('permintaans')->restrictOnDelete();
            $table->foreignId('id_user')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('status', 20);
            $table->string('aksi', 30);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['id_permintaan', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riwayat_permintaans');
    }
};
