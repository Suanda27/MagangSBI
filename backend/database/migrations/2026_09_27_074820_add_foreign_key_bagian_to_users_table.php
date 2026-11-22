<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel users dibuat sebelum bagians, jadi foreign key users.id_bagian
 * dipasang di migrasi terpisah setelah bagians ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('id_bagian')->references('id')->on('bagians')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_bagian']);
        });
    }
};
