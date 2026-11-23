<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Plant dan lantai ikut aturan master data: dinonaktifkan, tidak dihapus (PRD Bagian 5).
 * Lokasi nonaktif tidak muncul di form pengajuan, tetapi tiket lama tetap menyimpannya.
 * Migrasi terpisah (bukan mengubah migrasi lama) agar database yang sudah berjalan cukup `php artisan migrate`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->string('status', 10)->default('aktif')->after('nama_plant');
        });

        Schema::table('lantais', function (Blueprint $table) {
            $table->string('status', 10)->default('aktif')->after('id_plant');
        });
    }

    public function down(): void
    {
        Schema::table('lantais', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
