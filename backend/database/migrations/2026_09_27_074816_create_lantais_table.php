<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Master lokasi: lantai di dalam plant. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lantais', function (Blueprint $table) {
            $table->id();
            $table->string('nama_lantai');
            $table->foreignId('id_plant')->constrained('plants')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['id_plant', 'nama_lantai']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lantais');
    }
};
