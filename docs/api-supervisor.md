# API Supervisor (Sprint 2 sampai 4)

Semua rute berawalan `/api/supervisor`, butuh login (cookie Sanctum) dan peran **Supervisor** dengan akun aktif.
Peran lain mendapat 403, tanpa login 401. Semuanya **hanya baca**: supervisor tidak dapat mengubah tiket.

**Cakupan data selalu section milik supervisor** (aturan A1). Tiket section lain tidak terhitung, tidak tampil,
dan detailnya dijawab 404. Supervisor tanpa section mendapat data kosong, bukan error.

Tanggal memakai format `YYYY-MM-DD` dan mengacu pada **tanggal pengajuan**. Hari `sampai` ikut dihitung seluruhnya.
`sampai` tidak boleh sebelum `dari`. Parameter tidak valid dijawab 422 dengan pesan berbahasa Indonesia.

## `GET /api/supervisor/dashboard`

```json
{ "data": {
  "bagian": { "id": 5, "kode_bagian": "GA", "nama_bagian": "General Affairs" },
  "total": 15, "berjalan": 14, "baru_hari_ini": 2,
  "per_status": { "submitted": 1, "in_progress": 0, "pending": 12, "waiting_review": 1, "completed": 0, "rejected": 1 },
  "rasio_selesai": 6.7, "rata_durasi_jam": 7, "rata_revisi": 0.2,
  "terbaru": [ /* maks 6 tiket */ ], "aktivitas": [ /* maks 8 kejadian riwayat */ ]
} }
```
`rasio_selesai`, `rata_durasi_jam`, dan `rata_revisi` bernilai `null` bila belum ada data. Tanpa SLA (D1).

## `GET /api/supervisor/permintaan` (monitoring)

| Query | Keterangan |
|---|---|
| `status` | satu atau beberapa status dipisah koma (`submitted`, `in_progress`, `pending`, `waiting_review`, `completed`, `rejected`) |
| `layanan` | id layanan |
| `dari`, `sampai` | rentang tanggal pengajuan |
| `q` | nomor tiket, judul, atau nama pengaju (tidak peka huruf besar-kecil) |
| `page`, `per_page` | paginasi (bawaan 10, maksimal 50) |

Respons: `data` (daftar tiket, terbaru dulu) dan `meta`. Setiap baris memuat `id`, `kode_tiket`, `judul`, `status`,
`status_label` (label umum, mis. "Menunggu Pemeriksaan"), `prioritas`, `layanan`, `pengaju` (nama), `pic` (nama atau `null`),
`lokasi`, dan `dibuat_pada`. Semua status tampil, termasuk yang masih menunggu PIC.

## `GET /api/supervisor/permintaan/{id}`
Detail read-only: data tiket, lokasi, `pengaju`, `pic`, `lampiran` pengajuan, `hasil_kerja` per putaran, alasan tolak,
pending, dan revisi, `jumlah_revisi`, serta `riwayat` (timeline). Tiket section lain atau yang tidak ada dijawab 404.
Lampiran diunduh lewat `GET /api/lampiran/{id}` (boleh untuk supervisor section yang sama).

## `GET /api/supervisor/laporan`

Filter: `dari`, `sampai`, `status` (boleh beberapa), `layanan`, `page`, `per_page` (bawaan 15, maksimal 100).
Parameter cakupan (`id_bagian`, `id_pic`, `id_plant`, `id_layanan`) **diabaikan**: section selalu diambil dari akun.

Respons: `data` (rekap tiket berpaginasi, bentuk sama dengan monitoring), `meta`, dan `ringkasan` untuk **seluruh hasil
filter** (bukan hanya halaman ini), sehingga kartu, grafik, tabel, dan ekspor selalu konsisten:

| Kunci `ringkasan` | Isi |
|---|---|
| `total`, `per_status` | jumlah tiket dan jumlah per status (enam status, nol bila kosong) |
| `per_layanan` | `{id, nama_layanan, kategori, jumlah}`, terbanyak dulu |
| `per_kategori` | `{kategori, jumlah}`, terbanyak dulu |
| `selesai` | `jumlah`, `rata_rata_jam` (diajukan sampai selesai), `tanpa_revisi_persen`; `null` bila belum ada tiket selesai |
| `rata_revisi` | rata-rata jumlah revisi per tiket, `null` bila tidak ada tiket |
| `ditutup_otomatis` | jumlah **tiket** (bukan kejadian) yang pernah ditutup otomatis |
| `granularitas`, `tren` | `hari` (sampai 31 hari), `minggu` (sampai 180 hari, mulai Senin), atau `bulan`. Tiap titik: `kunci`, `label`, `diajukan`, `selesai` |

Titik tren tanpa tiket tetap muncul dengan angka nol. Tanpa `dari` dan `sampai`, rentangnya dari tiket terawal sampai terakhir.
Tanpa SLA (D1).

Ekspor (`GET /api/supervisor/laporan/export?format=...`) menyusul setelah layanan ekspor bersama siap.
