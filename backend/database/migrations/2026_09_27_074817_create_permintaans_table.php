<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permintaans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_tiket')->unique();
            $table->foreignId('id_karyawan')->constrained('users')->cascadeOnDelete();
            $table->foreignId('id_layanan')->constrained('layanans')->cascadeOnDelete();
            $table->foreignId('id_pic')->nullable()->constrained('users')->nullOnDelete();
            $table->string('lokasi')->nullable();
            $table->text('deskripsi');
            $table->string('status')->default('Submitted');
            $table->timestamp('tanggal_selesai')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permintaans');
    }
};
