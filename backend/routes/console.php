<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tiket Menunggu Konfirmasi yang tidak ditanggapi karyawan dalam 3 hari kerja ditutup otomatis (PRD).
// Di server produksi butuh cron "* * * * * php artisan schedule:run"; saat pengembangan: php artisan schedule:work.
Schedule::command('tiket:tutup-otomatis')->hourly()->withoutOverlapping()->onOneServer();
