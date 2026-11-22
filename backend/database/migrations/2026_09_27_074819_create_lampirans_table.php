<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Berkas pengajuan (dari karyawan) dan bukti hasil kerja (dari PIC).
 * putaran: untuk jenis "penyelesaian" = pengiriman hasil ke-n (mulai 1); kosong untuk "pengajuan".
 * Berkas disimpan di disk private; path_file berisi lokasi relatif.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lampirans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_permintaan')->constrained('permintaans')->restrictOnDelete();
            $table->foreignId('id_user')->constrained('users')->restrictOnDelete();
            $table->string('jenis', 15)->default('pengajuan');
            $table->unsignedSmallInteger('putaran')->nullable();
            $table->string('nama_file');
            $table->string('path_file');
            $table->string('tipe_file', 100);
            $table->unsignedInteger('ukuran_file');           // byte
            $table->timestamps();

            $table->index(['id_permintaan', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lampirans');
    }
};
