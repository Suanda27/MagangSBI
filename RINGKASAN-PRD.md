# Ringkasan PRD — Sistem Layanan Internal
**PT Sumitomo Wiring Systems Batam Indonesia** · Dokumen ini adalah versi yang lebih mudah dipahami dari `PRD.MD`.
Jika ada perbedaan, **`PRD.MD` yang berlaku**.

## Isi
1. [Sistem ini untuk apa?](#1-sistem-ini-untuk-apa)
2. [Istilah penting](#2-istilah-penting)
3. [Empat peran dan hak aksesnya](#3-empat-peran-dan-hak-aksesnya)
4. [Perjalanan sebuah tiket](#4-perjalanan-sebuah-tiket)
5. [Aturan bisnis](#5-aturan-bisnis)
6. [Fitur dan halaman per peran](#6-fitur-dan-halaman-per-peran)
7. [Data yang disimpan (database)](#7-data-yang-disimpan-database)
8. [Jalur komunikasi frontend–backend (API)](#8-jalur-komunikasi-frontendbackend-api)
9. [Keamanan dan standar teknis](#9-keamanan-dan-standar-teknis)
10. [Pembagian kerja dan jadwal](#10-pembagian-kerja-dan-jadwal)
11. [Keputusan yang sudah diambil](#11-keputusan-yang-sudah-diambil)
12. [Posisi pekerjaan saat ini](#12-posisi-pekerjaan-saat-ini)

---

## 1. Sistem ini untuk apa?

**Masalah:** permintaan layanan antar-seksi (perbaikan AC, akses sistem, surat keterangan, dan sebagainya) sekarang tersebar lewat kertas, telepon, dan chat. Sulit dilacak, mudah terlewat, dan tidak ada rekapnya.

**Solusi:** satu aplikasi web internal tempat karyawan **mengajukan tiket**, seksi terkait **mengerjakannya**, dan semua pihak **memantau statusnya**.

**Lima seksi yang terlibat:** Assembly (ASM), Human Resource (HR), Information System (IS), Production Engineering (PE), General Affairs (GA).

**Teknologi:**

| Bagian | Teknologi |
|---|---|
| Tampilan (frontend) | Next.js 16, React 19, Tailwind CSS, shadcn/ui, font Inter |
| Otak aplikasi (backend) | Laravel 13 (PHP 8.3), API REST, login memakai Sanctum (cookie) |
| Penyimpanan data | MySQL |
| Lingkungan | Intranet, berdiri sendiri, tidak terhubung ke sistem MySBI |

---

## 2. Istilah penting

| Istilah | Artinya |
|---|---|
| **Tiket / Permintaan** | Satu permintaan layanan yang diajukan karyawan |
| **Section / Seksi** | Unit kerja (ASM, HR, IS, PE, GA) |
| **Section asal** | Section tempat karyawan pengaju bekerja |
| **Section tujuan** | Section yang akan mengerjakan tiket (ditentukan oleh layanan yang dipilih) |
| **Layanan** | Jenis permintaan yang tersedia, misalnya "Perbaikan AC". Setiap layanan milik satu section |
| **PIC** | *Person in Charge*, petugas section tujuan yang mengerjakan tiket |
| **Antrean** | Daftar tiket baru yang menunggu PIC section tujuan |
| **Self-tracking** | Karyawan memantau sendiri status tiketnya |
| **Bukti / hasil kerja** | Foto atau PDF yang diunggah PIC sebagai bukti pekerjaan selesai |
| **Revisi** | Permintaan karyawan agar PIC memperbaiki hasil kerja |
| **Final** | Status yang tidak bisa diubah lagi (Selesai, Ditolak) |

---

## 3. Empat peran dan hak aksesnya

| Peran | Pengerja | Tugas utama |
|---|---|---|
| **Karyawan** | Syifa | Mengajukan tiket, memantau, **meninjau hasil kerja PIC** |
| **PIC** | Faiz | Menerima atau menolak tiket di section-nya, mengerjakan, mengirim hasil |
| **Supervisor** | Syifa | Memantau dan membuat laporan **untuk section tujuannya** |
| **Admin** | Faiz | Mengelola pengguna, section, layanan, lokasi, PIC, dan pengaturan |

**Siapa boleh apa?**

| Aksi | Karyawan | PIC | Supervisor | Admin |
|---|---|---|---|---|
| Buat tiket | ✅ | | | |
| Lihat tiket | Milik sendiri | Antrean section-nya + tiket yang ia tangani | Tiket yang masuk ke section-nya | Semua |
| Terima / tolak / update status / kirim hasil | | ✅ | | |
| Setujui atau minta revisi | ✅ (tiket miliknya) | | | |
| Laporan | | Kinerja pribadi | Section-nya | Semua section |
| Kelola master data & pengguna | | | | ✅ |

> Hak akses dijaga **di server**. Mengubah tampilan di browser tidak bisa melewatinya.

---

## 4. Perjalanan sebuah tiket

### 4.1 Alur lengkap

```
Karyawan mengajukan tiket
        │   (nomor tiket dibuat otomatis, misalnya GA-2026-0001)
        ▼
 ┌─ Antrean section tujuan ─┐
 │  PIC section itu memutuskan │
 └──────┬───────────────┬────┘
        │ TERIMA        │ TOLAK (alasan wajib)
        ▼               ▼
  Sedang Diproses     DITOLAK  ← final
     ▲    │
     │    └──▶ Pending (alasan wajib) ──▶ kembali Sedang Diproses
     │
     │  PIC upload hasil kerja lalu menekan "Kirim untuk Ditinjau"
     │                 ▼
     │        Menunggu Konfirmasi
     │          │            │
     │  PERLU REVISI    SESUAI / 3 hari kerja tanpa respons
     │ (alasan wajib)        ▼
     └──────────┘         SELESAI  ← final
```

### 4.2 Contoh nyata
1. **Faiz** (Assembly) mengajukan "AC ruang kerja tidak dingin" ke layanan GA. Tiket menjadi `GA-2026-0001`.
2. **PIC GA** menerima tiket, sehingga statusnya **Sedang Diproses**.
3. PIC memperbaiki AC, mengunggah foto, lalu menekan **Kirim untuk Ditinjau**.
4. Faiz menerima notifikasi, melihat foto, dan menjawab **Perlu Revisi** dengan alasan "masih menetes air".
5. PIC memperbaiki lagi dan mengirim ulang. Faiz menekan **Sesuai**. Tiket menjadi **Selesai**.

### 4.3 Daftar status

| Status | Tampil sebagai | Keterangan |
|---|---|---|
| `submitted` | Diajukan / Menunggu Pemeriksaan | Baru masuk, belum ada PIC |
| `in_progress` | Sedang Diproses | Sedang dikerjakan PIC (juga setelah revisi diminta) |
| `pending` | Pending | Ditunda, menunggu pihak lain |
| `waiting_review` | Menunggu Konfirmasi | Hasil sudah dikirim, menunggu karyawan |
| `completed` | Selesai | Disetujui atau ditutup otomatis (**final**) |
| `rejected` | Ditolak | Ditolak PIC (**final**) |

### 4.4 Siapa menerima notifikasi

| Kejadian | Penerima |
|---|---|
| Tiket baru diajukan | Semua PIC aktif di section tujuan |
| Tiket diterima / ditolak / ditunda / dilanjutkan | Karyawan pengaju |
| Hasil kerja dikirim | Karyawan pengaju (perlu ditinjau) |
| Revisi diminta / hasil disetujui | PIC penanggung jawab |
| Ditutup otomatis | Karyawan dan PIC |

Notifikasi hanya muncul **di dalam aplikasi** (ikon lonceng), tidak lewat email.

---

## 5. Aturan bisnis

**Penugasan**
- Tiket hanya terlihat dan bisa diterima oleh **PIC dari section tujuan**. Tiket GA hanya bisa diterima PIC GA.
- Satu PIC hanya satu section.
- Jika dua PIC dalam satu section menekan Terima bersamaan, **yang pertama menang**. Yang kedua mendapat penolakan (kode 409).
- Setelah diterima, hanya PIC penanggung jawab yang boleh mengubah status dan mengirim hasil.

**Tiket**
- **Tanpa SLA.** Tidak ada hitung mundur atau laporan kepatuhan waktu.
- **Prioritas** (Normal / Tinggi / Mendesak) hanya label untuk mengurutkan antrean: Mendesak dulu, lalu yang paling lama menunggu.
- Karyawan **tidak bisa mengedit atau membatalkan** tiket. Jika salah isi, ajukan tiket baru.
- Selesai dan Ditolak bersifat **final**.

**Hasil kerja dan revisi**
- PIC wajib melampirkan **minimal 1 bukti** sebelum mengirim hasil.
- Revisi **tanpa batas jumlah**. Karyawan hanya mengisi **alasan teks** (minimal 10 karakter).
- Revisi selalu kembali ke **PIC yang sama**.
- Jika karyawan tidak meninjau dalam **3 hari kerja** (Senin–Jumat, tanpa hari libur nasional), tiket **ditutup otomatis**.

**Nomor tiket:** `{KODE SECTION}-{TAHUN}-{URUTAN}`, misalnya `IS-2026-0014`. Urutannya terpisah per section dan per tahun. Dibuat oleh server, bukan oleh karyawan.

**Lampiran:** JPG, PNG, atau PDF; maksimal 5 MB per berkas; maksimal 5 berkas untuk pengajuan dan 5 untuk bukti.

**Akun:** karyawan mendaftar sendiri dan langsung aktif sebagai Karyawan. Peran PIC, Supervisor, dan Admin hanya bisa diberikan oleh Admin.

---

## 6. Fitur dan halaman per peran

### 6.1 Karyawan
| Halaman | Fungsi |
|---|---|
| Registrasi, Login | Membuat akun dan masuk |
| Dashboard | Jumlah tiket per status dan tiket terbaru |
| Pengajuan Layanan, langkah 1 | Memilih section tujuan |
| Pengajuan Layanan, langkah 2 | Form tiket: kategori, layanan, lokasi (plant dan lantai), judul, deskripsi, urgensi, lampiran. Kolom tambahan menyesuaikan section |
| Permintaan Saya | Daftar tiket dengan filter, pencarian, dan pagination |
| Detail Permintaan | Informasi tiket, timeline status, log aktivitas, hasil kerja PIC, tombol **Sesuai / Perlu Revisi** |
| Riwayat | Semua aktivitas tiket, dikelompokkan per bulan |
| Profil | Ubah nama, email, telepon |

### 6.2 PIC
| Halaman | Fungsi |
|---|---|
| Dashboard | Ringkasan angka dan tiket yang perlu ditangani |
| Permintaan Masuk | Antrean section, panel "Periksa", terima atau tolak |
| Sedang Diproses | Tiket yang ia tangani (Diproses, Pending, Menunggu Konfirmasi) |
| Detail Permintaan | Update status, upload hasil, **Kirim untuk Ditinjau**, melihat alasan revisi |
| Selesai | Arsip tiket Selesai dan Ditolak |
| Laporan | Kinerja pribadi (jumlah, durasi rata-rata, rata-rata revisi) |
| Profil | Ubah data kontak |

### 6.3 Supervisor
| Halaman | Fungsi |
|---|---|
| Dashboard | Ringkasan tiket section-nya |
| Monitoring Permintaan | Daftar dan detail tiket dengan filter tanggal, status, layanan |
| Laporan | Rekap dan ekspor PDF/Excel |
| Pengaturan | Pengaturan akun |

### 6.4 Admin
| Halaman | Fungsi |
|---|---|
| Dashboard | Ringkasan sistem |
| Pengguna | Tambah, lihat, ubah, **nonaktifkan** akun dan atur peran |
| Section | Kelola daftar section |
| Layanan | Kelola katalog layanan |
| PIC | Menetapkan PIC ke section |
| Lokasi | Kelola plant dan lantai (**halaman baru, belum ada**) |
| Semua Permintaan | Melihat seluruh tiket semua section |
| Laporan | Rekap menyeluruh dan ekspor |
| Settings | Profil, ganti password, batas ukuran dan format lampiran |

---

## 7. Data yang disimpan (database)

Database memakai **MySQL**. Data master tidak dihapus, hanya **dinonaktifkan**, agar tiket lama tetap utuh.

| Tabel | Isinya, dalam bahasa sederhana |
|---|---|
| `users` | Semua akun: nama, NIK, email, password, **peran**, section, jabatan, telepon, status aktif |
| `bagians` | Daftar section (kode, nama, status) |
| `layanans` | Katalog layanan, setiap layanan milik satu section |
| `plants`, `lantais` | Lokasi: plant, dan lantai di dalamnya |
| `permintaans` | **Tiket:** pengaju, layanan, section tujuan, PIC, lokasi, judul, deskripsi, prioritas, status, waktu penting, alasan (tolak/pending/revisi), jumlah revisi |
| `riwayat_permintaans` | Catatan setiap perubahan: siapa, kapan, aksi apa. Pelaku boleh kosong untuk kejadian oleh sistem |
| `lampirans` | File pengajuan dan bukti hasil kerja, bukti dicatat **per putaran** |
| `urutan_tikets` | Penghitung nomor tiket per section per tahun |
| `pengaturans` | Pengaturan sistem (batas upload, format file) |
| `notifications` | Notifikasi dalam aplikasi |

**Hubungan antar tabel (disederhanakan):**
```
Section ─┬─▶ Pengguna (karyawan / PIC / supervisor)
         ├─▶ Layanan ──▶ Tiket ◀── Pengaju (pengguna)
         └─▶ Tiket (section tujuan)        ▲
Plant ──▶ Lantai ──▶ Tiket                 └── PIC penanggung jawab (pengguna)
Tiket ─┬─▶ Riwayat perubahan status
       └─▶ Lampiran (pengajuan dan bukti hasil kerja)
```

---

## 8. Jalur komunikasi frontend–backend (API)

Semua alamat diawali `/api`. Daftar memakai pagination.

| Kelompok | Fungsi |
|---|---|
| **Akun (semua peran)** | daftar, login, logout, profil saya, ganti password, notifikasi |
| **Referensi** | daftar section, layanan per section, lokasi, unduh lampiran |
| **Karyawan** | dashboard, daftar dan detail tiket, buat tiket, **setujui**, **revisi**, riwayat |
| **PIC** | dashboard, antrean, tiket saya, **accept**, **reject**, update status, **kirim-hasil**, riwayat, laporan |
| **Supervisor** | dashboard, daftar dan detail tiket, laporan, ekspor |
| **Admin** | pengguna, section, layanan, plant, lantai, pemetaan PIC, semua tiket, laporan, ekspor, pengaturan |

**Arti kode jawaban:**

| Kode | Arti |
|---|---|
| 200 / 201 | Berhasil / berhasil dibuat |
| 401 | Belum login |
| 403 | Bukan hak Anda |
| 404 | Tidak ditemukan |
| 409 | Konflik (misalnya tiket sudah diambil PIC lain) |
| 422 | Isian tidak valid, disertai pesan per kolom |

---

## 9. Keamanan dan standar teknis

- Password disimpan terenkripsi (hash). Login memakai **cookie + CSRF** (Sanctum), dan percobaan login dibatasi.
- **Hak akses dan perpindahan status dijaga di server.**
- File disimpan di penyimpanan **privat** dan diunduh lewat endpoint yang dijaga.
- Zona waktu `Asia/Jakarta`, bahasa Indonesia.
- **Penjadwal:** satu tugas harian menutup otomatis tiket yang tidak ditinjau.
- **Pengujian:** feature test (login, hak akses, alur lengkap, revisi berulang, tutup otomatis, konflik terima ganda), Black-box Testing, dan System Integration Testing.
- **Data awal (seeder):** 5 section, katalog layanan, plant dan lantai, dan satu akun per peran.

---

## 10. Pembagian kerja dan jadwal

**4 sprint × 3 minggu = 12 minggu.**

| Sprint | Syifa (Karyawan, Supervisor) | Faiz (PIC, Admin) |
|---|---|---|
| **1** | Setup, database final, login/registrasi | Setup, database final, auth dan hak akses |
| **2** | Form pengajuan, upload, nomor tiket; dashboard Supervisor | CRUD master data Admin (pengguna, section, layanan, lokasi, PIC, settings) |
| **3** | Permintaan Saya, timeline, riwayat, notifikasi, **tinjau hasil kerja**; monitoring Supervisor | Antrean PIC, terima/tolak, update status, **kirim hasil**, pengerjaan revisi, laporan PIC |
| **4** | Laporan + ekspor, sambungkan ke API, UAT | Laporan Admin, **penjadwal tutup otomatis**, integrasi, pengujian |

---

## 11. Keputusan yang sudah diambil

| # | Topik | Keputusan |
|---|---|---|
| D1 | SLA | Tidak ada |
| D2 | Prioritas | Tetap ada sebagai label |
| D3 | Penugasan PIC | Antrean bersama per section; PIC pertama yang menerima |
| D4 | PIC–section | Satu PIC = satu section |
| D5 | Login | Sanctum SPA (cookie) |
| D6 | Tabel akun | Satu tabel `users` dengan kolom peran |
| D7 | Hak karyawan | Tidak bisa edit atau batal; memantau dan meninjau hasil |
| D8 | Notifikasi | Hanya di dalam aplikasi |
| D9 | Pembuatan akun | Daftar sendiri, langsung aktif sebagai Karyawan |
| D10 | Cakupan Supervisor | Section **tujuan** miliknya |
| D11 | Settings Admin | Profil, ganti password, batas ukuran dan format lampiran |
| D12 | Nomor tiket | Per section: `GA-2026-0001` |
| D13 | Konfirmasi hasil | PIC kirim hasil; karyawan setujui atau minta revisi |
| D14 | Tutup otomatis | 3 hari kerja tanpa tinjauan |
| D15 | Revisi | Tanpa batas; alasan teks saja |

**Asumsi dengan status konfirmasi**

| Asumsi | Status |
|---|---|
| Supervisor melihat section tujuan | Terkonfirmasi |
| 3 hari kerja = Senin–Jumat, tanpa hari libur nasional | Terkonfirmasi |
| Revisi kembali ke PIC yang sama | Terkonfirmasi |
| Maksimal 5 berkas per kategori lampiran | Terkonfirmasi |
| Tiket Selesai dan Ditolak final | Belum dikonfirmasi eksplisit |
| PIC yang menolak dicatat sebagai `id_pic` | Belum dikonfirmasi eksplisit |
| Bukti dari putaran revisi sebelumnya tetap tersimpan | Belum dikonfirmasi eksplisit |

---

## 12. Posisi pekerjaan saat ini

| Bagian | Kondisi |
|---|---|
| PRD | Final, kecuali tiga asumsi yang belum dikonfirmasi eksplisit |
| Frontend Login dan Admin | Sudah ada |
| Frontend PIC | Sudah ada (branch `faiz/pic-ui`), **perlu disesuaikan**: hapus SLA, ganti "Tandai Selesai" menjadi "Kirim untuk Ditinjau", ganti format nomor tiket |
| Frontend Karyawan | Belum ada (sempat dibuat lalu dibatalkan) |
| Frontend Supervisor | Baru kerangka dasar |
| Backend | Baru migrasi awal dan model kosong. **Belum ada** API, login, seeder |

**Langkah berikutnya yang disarankan:** (1) konfigurasi dasar backend (MySQL, timezone, Sanctum, CORS), (2) migrasi dan model sesuai PRD final, (3) login dan hak akses, (4) endpoint per peran, (5) sambungkan frontend ke API.
