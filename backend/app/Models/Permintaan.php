<?php

namespace App\Models;

use App\Enums\Prioritas;
use App\Enums\StatusPermintaan;
use Database\Factories\PermintaanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Tiket permintaan layanan.
 *
 * id_bagian = section TUJUAN (disalin dari layanan saat dibuat).
 * id_karyawan = pengaju, id_pic = PIC penanggung jawab (kosong sampai ada yang menerima).
 * Perpindahan status HARUS lewat App\Services\TicketWorkflow (Langkah 3), bukan langsung di model.
 */
#[Fillable([
    'kode_tiket', 'id_karyawan', 'id_layanan', 'id_bagian', 'id_pic',
    'id_plant', 'id_lantai', 'lokasi_detail',
    'judul', 'deskripsi', 'prioritas', 'status',
    'diterima_pada', 'ditolak_pada', 'dikirim_pada', 'selesai_pada', 'jumlah_revisi',
    'alasan_tolak', 'alasan_pending', 'alasan_revisi', 'catatan_hasil',
])]
class Permintaan extends Model
{
    /** @use HasFactory<PermintaanFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'prioritas' => Prioritas::class,
            'status' => StatusPermintaan::class,
            'diterima_pada' => 'datetime',
            'ditolak_pada' => 'datetime',
            'dikirim_pada' => 'datetime',
            'selesai_pada' => 'datetime',
            'jumlah_revisi' => 'integer',
        ];
    }

    // ---- Relasi -------------------------------------------------------

    /** Karyawan pengaju. */
    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_karyawan');
    }

    /** PIC penanggung jawab. */
    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_pic');
    }

    public function layanan(): BelongsTo
    {
        return $this->belongsTo(Layanan::class, 'id_layanan');
    }

    /** Section tujuan. */
    public function bagian(): BelongsTo
    {
        return $this->belongsTo(Bagian::class, 'id_bagian');
    }

    public function plant(): BelongsTo
    {
        return $this->belongsTo(Plant::class, 'id_plant');
    }

    public function lantai(): BelongsTo
    {
        return $this->belongsTo(Lantai::class, 'id_lantai');
    }

    public function riwayat(): HasMany
    {
        return $this->hasMany(RiwayatPermintaan::class, 'id_permintaan')->orderBy('created_at')->orderBy('id');
    }

    public function lampirans(): HasMany
    {
        return $this->hasMany(Lampiran::class, 'id_permintaan');
    }

    // ---- Scope --------------------------------------------------------

    /** Tiket milik karyawan tertentu. */
    public function scopeMilik(Builder $query, User $karyawan): Builder
    {
        return $query->where('id_karyawan', $karyawan->id);
    }

    /** Tiket yang ditujukan ke section tertentu (cakupan Supervisor). */
    public function scopeUntukSection(Builder $query, int $idBagian): Builder
    {
        return $query->where('id_bagian', $idBagian);
    }

    /** Antrean PIC: tiket baru di section PIC yang belum diambil siapa pun. */
    public function scopeAntreanUntuk(Builder $query, User $pic): Builder
    {
        return $query->where('id_bagian', $pic->id_bagian)
            ->where('status', StatusPermintaan::Submitted->value)
            ->whereNull('id_pic');
    }

    /** Tiket yang ditangani PIC tertentu. */
    public function scopeDitanganiOleh(Builder $query, User $pic): Builder
    {
        return $query->where('id_pic', $pic->id);
    }

    /** Tiket yang belum final. */
    public function scopeBerjalan(Builder $query): Builder
    {
        return $query->whereIn('status', StatusPermintaan::aktif());
    }

    /** Urutan antrean: prioritas Mendesak → Tinggi → Normal, lalu yang paling lama menunggu. */
    public function scopeUrutAntrean(Builder $query): Builder
    {
        return $query
            ->orderByRaw("CASE prioritas WHEN 'mendesak' THEN 3 WHEN 'tinggi' THEN 2 ELSE 1 END DESC")
            ->orderBy('created_at')
            ->orderBy('id');
    }
}
