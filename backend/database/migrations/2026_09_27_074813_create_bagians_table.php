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
        Schema::create('bagians', function (Blueprint $table) {
            $table->id();
            $table->string('nama_bagian');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('id_bagian')->references('id')->on('bagians')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['id_bagian']);
        });
        Schema::dropIfExists('bagians');
    }
};
