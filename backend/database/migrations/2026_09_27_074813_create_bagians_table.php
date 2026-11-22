<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Master section (Assembly, HR, IS, PE, GA).
 * Kode dipakai pada nomor tiket, mis. GA-2026-0001.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bagians', function (Blueprint $table) {
            $table->id();
            $table->string('kode_bagian', 10)->unique();
            $table->string('nama_bagian');
            $table->text('deskripsi')->nullable();
            $table->string('status', 10)->default('aktif');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bagians');
    }
};
