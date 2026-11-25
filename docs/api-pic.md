# API PIC (baca) — Sprint 3.1

Semua rute berawalan `/api/pic`, butuh login (cookie Sanctum) dan peran **PIC** dengan akun aktif.
Peran lain mendapat 403, tanpa login 401. Aksi terima/tolak/ubah status/kirim hasil menyusul di 3.2 dan seterusnya.

Antrean bersama: semua PIC di satu section melihat antrean yang sama. Tiket "milik saya" adalah tiket
dengan `id_pic` = PIC yang sedang masuk (termasuk yang ia tolak).

## `GET /api/pic/dashboard`

```json
{ "data": {
  "antrean": 2, "sedang_diproses": 1, "pending": 1,
  "menunggu_konfirmasi": 1, "selesai": 1, "ditolak": 1,
  "antrean_teratas": [ /* maks 5 tiket, bentuk sama dengan item daftar */ ]
} }
```

`antrean` dan `antrean_teratas` = tiket baru (`submitted`) di section PIC yang belum diambil siapa pun,
urut prioritas Mendesak → Tinggi → Normal, lalu yang paling lama menunggu.
Angka lainnya hanya menghitung tiket yang ditangani PIC ini.

## `GET /api/pic/permintaan`

| Query | Keterangan |
|---|---|
| `tab` | `masuk` (bawaan), `diproses`, atau `selesai` |
| `status` | opsional, dipisah koma; hanya status milik tab yang berlaku (irisan) |
| `prioritas` | `normal`, `tinggi`, `mendesak` |
| `layanan` | id layanan |
| `q` | mencari nomor tiket atau judul |
| `page`, `per_page` | paginasi (bawaan 10, maks 50) |

Isi tab:
- `masuk`: antrean section (urut prioritas, lalu terlama).
- `diproses`: milik saya yang `in_progress`, `pending`, `waiting_review` (terbaru diperbarui dulu).
- `selesai`: milik saya yang `completed` atau `rejected`.

Respons berpaginasi (`data`, `links`, `meta`). Item memuat `kode_tiket`, `judul`, `status`, `status_label`
(label umum, mis. "Menunggu Pemeriksaan"), `prioritas`, `layanan`, `bagian`, `lokasi`, `pengaju`
(`id`, `name`, `nik`, `jabatan`), `diterima_pada`, `selesai_pada`, `dibuat_pada`.
Nilai tidak valid pada `tab`, `status`, `prioritas`, `per_page` dijawab 422.

## `GET /api/pic/permintaan/{id}`

Detail lengkap: semua field daftar ditambah `deskripsi`, `pengaju` (plus `telepon`, `bagian`), `pic`,
`lampiran` (pengajuan), `hasil_kerja` (`catatan`, `dikirim_pada`, `putaran[]` berisi berkas per putaran),
`alasan_tolak`, `alasan_pending`, `alasan_revisi`, `jumlah_revisi`, dan `riwayat[]`.

Boleh dibuka bila tiket baru di section PIC itu atau tiket yang ia tangani (`PermintaanPolicy::view`).
Tiket section lain atau milik PIC lain dijawab 403; id yang tidak ada 404.

# API PIC (aksi) — Sprint 3.2

Semua aksi `POST`, berawalan `/api/pic/permintaan/{id}`. Respons sukses (200) = detail tiket terbaru
(bentuk sama dengan `GET /api/pic/permintaan/{id}`), jadi status dan riwayat langsung segar.

| Kode | Arti |
|---|---|
| 403 | Bukan hak PIC ini (section lain, atau bukan penanggung jawab tiket) |
| 404 | Tiket tidak ada |
| 409 | Keadaan tiket sudah berubah (diambil PIC lain, status tidak cocok, tiket sudah final) |
| 422 | Isian tidak valid (alasan kosong atau terlalu pendek, status tujuan salah) |

## `POST /api/pic/permintaan/{id}/terima`
Body opsional: `{ "catatan": "…" }` (maks 1000). Diajukan → Sedang Diproses; PIC ini menjadi penanggung jawab.
Bila dua PIC menekan bersamaan, hanya satu yang menang; yang lain 409.

## `POST /api/pic/permintaan/{id}/tolak`
Body: `{ "alasan": "…" }`, wajib, 10–1000 karakter. Diajukan → Ditolak (final). PIC yang menolak tercatat sebagai `id_pic`.

## `POST /api/pic/permintaan/{id}/status`
Body: `{ "status": "pending" | "in_progress", "alasan": "…" }`. Hanya PIC penanggung jawab.
- `pending` (tunda): Diproses → Pending, `alasan` wajib minimal 5 karakter.
- `in_progress` (lanjutkan): Pending → Diproses, `alasan_pending` dikosongkan.
Status tujuan lain (mis. `completed`) ditolak 422; kirim hasil menyusul di Sprint 3.3.
