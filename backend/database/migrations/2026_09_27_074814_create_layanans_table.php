<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Katalog layanan. Setiap layanan milik satu section dan menentukan section tujuan tiket.
 * Master data tidak dihapus, hanya dinonaktifkan (kolom status).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layanans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_layanan', 20)->unique();
            $table->string('nama_layanan');
            $table->string('kategori');
            $table->text('deskripsi')->nullable();
            $table->foreignId('id_bagian')->constrained('bagians')->restrictOnDelete();
            $table->string('status', 10)->default('aktif');
            $table->timestamps();

            $table->index(['id_bagian', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layanans');
    }
};
