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
