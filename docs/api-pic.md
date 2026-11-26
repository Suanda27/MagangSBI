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

# Kirim hasil dan konfirmasi — Sprint 3.3

## `POST /api/pic/permintaan/{id}/kirim-hasil` (multipart/form-data)
Hanya PIC penanggung jawab. Field: `bukti[]` (wajib, 1–5 berkas; format dan ukuran mengikuti pengaturan Admin,
bawaan JPG/PNG/PDF maks 5 MB) dan `catatan` (opsional, maks 2000).
Diproses atau Pending → **Menunggu Konfirmasi**. Bukti disimpan per putaran (`hasil_kerja.putaran[]`);
saat ada revisi, bukti putaran lama tetap ada dan putaran baru bertambah. Dibatasi 30 permintaan per menit.
Kegagalan: 422 (bukti kosong, lebih dari 5, atau format salah), 403 (bukan penanggung jawab), 409 (status bukan Diproses/Pending).
Bila gagal, tidak ada berkas yang tersisa di disk.

## `POST /api/employee/permintaan/{id}/setujui`
Karyawan pengaju. Menunggu Konfirmasi → **Selesai** (final), `selesai_pada` terisi.

## `POST /api/employee/permintaan/{id}/revisi`
Body `{ "alasan": "…" }` (wajib, 10–1000 karakter). Menunggu Konfirmasi → **Sedang Diproses**,
`jumlah_revisi` bertambah, `alasan_revisi` terisi, PIC penanggung jawab tetap sama. Revisi tidak dibatasi jumlahnya.

Kedua aksi karyawan: tiket milik orang lain dijawab 404, peran lain 403, status tidak cocok (termasuk
menyetujui dua kali) 409. Respons sukses = detail tiket terbaru versi karyawan (`GET /api/employee/permintaan/{id}`).

Tutup otomatis setelah 3 hari kerja tanpa tanggapan dikerjakan di Sprint 4.

# Tutup otomatis — Sprint 4.1

Tiket **Menunggu Konfirmasi** yang tidak ditanggapi karyawan dalam **3 hari kerja** (Senin–Jumat, libur nasional
belum dihitung) sejak `hasil_kerja.dikirim_pada` ditutup otomatis menjadi **Selesai**.

- Perintah: `php artisan tiket:tutup-otomatis`, dijadwalkan **tiap jam** (`routes/console.php`).
- Riwayat mencatat aksi `auto_closed` dengan pelaku **Sistem** dan keterangan "Ditutup otomatis setelah 3 hari kerja tanpa tinjauan."
- Revisi atau kirim ulang hasil mengulang hitungan, karena `dikirim_pada` diperbarui.
- Aman dijalankan berulang; tiket yang sudah ditanggapi atau dikirim ulang saat perintah berjalan dilewati.
- Batas yang tampil di layar PIC memakai aturan hari kerja yang sama (`tambahHariKerja` di frontend dan `App\Support\HariKerja` di backend).

**Menjalankan penjadwal.** Server produksi butuh cron `* * * * * php artisan schedule:run`.
Saat pengembangan lokal jalankan `php artisan schedule:work` di terminal terpisah, atau panggil perintahnya manual.

# Laporan PIC — Sprint 4.5

Statistik **pribadi**: hanya tiket yang ditangani PIC itu sendiri (`id_pic` = dia, termasuk yang ia tolak). Tiket rekan, antrean, dan section lain tidak ikut.

| Query | Keterangan |
|---|---|
| `dari`, `sampai` | tanggal pengajuan, `YYYY-MM-DD`, kedua hari ikut dihitung; `sampai` tidak boleh sebelum `dari` |
| `id_bagian_pengaju` | section asal karyawan pengaju |

## `GET /api/pic/laporan`
`data`: `total`, `per_status`, `per_kategori`, `per_bagian_pengaju` (section asal pengaju), `top_layanan` (5 teratas: `jumlah`, `selesai`,
`rata_rata_jam`), `selesai` (`jumlah`, `rata_rata_jam`, `tanpa_revisi_persen`; `null` bila belum ada tiket selesai), dan
`antrean_saat_ini` (tiket baru di section PIC yang masih menunggu keputusan; tidak terpengaruh filter). Nilai tidak valid dijawab 422.

## `GET /api/pic/laporan/ekspor`
Tiket yang PIC ini tangani (sesuai filter) sebagai CSV dengan format yang sama seperti ekspor Admin
(UTF-8 BOM, titik koma, sel berawalan `=`, `+`, `-`, `@` dinetralkan). Dibatasi 20 permintaan per menit.
Penulis CSV dipakai bersama oleh Admin dan PIC (`App\Services\EksporTiketCsv`).
