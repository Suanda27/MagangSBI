<?php

namespace App\Providers;

use App\Models\Permintaan;
use App\Policies\PermintaanPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Aturan siapa boleh melakukan apa pada tiket (PRD 4.4).
        Gate::policy(Permintaan::class, PermintaanPolicy::class);
    }
}
