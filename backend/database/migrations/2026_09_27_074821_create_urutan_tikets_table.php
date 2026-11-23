<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Penghitung nomor tiket per section per tahun (GA-2026-0001, GA-2026-0002, ...).
 * Baris dikunci dengan lockForUpdate saat tiket dibuat agar tidak ada nomor ganda.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('urutan_tikets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_bagian')->constrained('bagians')->restrictOnDelete();
            $table->unsignedSmallInteger('tahun');
            $table->unsignedInteger('terakhir')->default(0);
            $table->timestamps();

            $table->unique(['id_bagian', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('urutan_tikets');
    }
};
