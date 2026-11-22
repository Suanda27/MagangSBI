# Pembagian Tugas — Faiz & Syifa
**Sistem Layanan Internal — PT Sumitomo Wiring Systems Batam Indonesia**

Prinsipnya mengikuti `PRD.MD`: **Syifa memegang Karyawan dan Supervisor, Faiz memegang PIC dan Admin.**
Bagian bersama (fondasi backend, login, layanan inti) dibagi supaya beban seimbang dan tidak saling menunggu.

## Isi
1. [Bagian bersama (fondasi)](#1-bagian-bersama-fondasi)
2. [Tugas Syifa — Karyawan dan Supervisor](#2-tugas-syifa--karyawan-dan-supervisor)
3. [Tugas Faiz — PIC dan Admin](#3-tugas-faiz--pic-dan-admin)
4. [Jadwal per sprint](#4-jadwal-per-sprint)
5. [Ketergantungan antar tugas](#5-ketergantungan-antar-tugas)
6. [Aturan kerja bersama (Git)](#6-aturan-kerja-bersama-git)
7. [Perkiraan beban](#7-perkiraan-beban)

---

## 1. Bagian bersama (fondasi)

| Pekerjaan | Pemilik | Alasan |
|---|---|---|
| Konfigurasi backend (MySQL, timezone `Asia/Jakarta`, bahasa `id`, Sanctum, CORS) | **Faiz** | Dikerjakan sekali, dipakai semua |
| Migrasi final, model + relasi, enum | **Faiz** | Semua endpoint bergantung pada ini |
| Seeder (section, layanan, plant/lantai, satu akun per peran) | **Faiz** | Satu sumber data demo untuk berdua |
| `EnsureRole` + `PermintaanPolicy` (hak akses) | **Faiz** | Inti aturan "PIC hanya section sendiri" |
| **`TicketWorkflow`** (mesin status: terima, tolak, update status, kirim hasil, setujui, revisi, tutup otomatis) | **Faiz** | Semua perpindahan status lewat satu tempat |
| Job tutup otomatis 3 hari kerja (`tiket:tutup-otomatis`) | **Faiz** | Memakai `TicketWorkflow` |
| Memindahkan komponen bersama (Modal, Drawer, Toast, Pagination, badge) dari `components/pic` ke `components/shared` | **Faiz** | Sudah dibuatnya, tinggal dirapikan agar bisa dipakai Syifa |
| API akun: daftar, login, logout, profil saya, ganti password | **Syifa** | Sudah punya branch registrasi |
| `api-client` frontend (axios, CSRF, penanganan error) + pengaman halaman per peran | **Syifa** | Dipakai semua halaman |
| Endpoint referensi (section, layanan per section, lokasi) | **Syifa** | Dipakai form pengajuannya |
| `TicketNumberGenerator` (nomor per section, misalnya `GA-2026-0001`) | **Syifa** | Dibutuhkan saat membuat tiket |
| `FileUploadService` + endpoint unduh lampiran | **Syifa** | Dipakai pertama kali oleh form tiket |
| Notifikasi dalam aplikasi (kelas notifikasi + endpoint) | **Syifa** | Lonceng pertama muncul di portal karyawan |
| Layanan ekspor PDF/Excel (dipakai Supervisor, PIC, Admin) | **Syifa** | Fitur ekspor memang miliknya |

---

## 2. Tugas Syifa — Karyawan dan Supervisor

### Backend
- **Employee:** dashboard, daftar / buat / detail tiket (dengan unggah lampiran), riwayat, **setujui**, **revisi**.
- **Supervisor:** dashboard, monitoring dengan filter (tanggal, status, layanan), detail, laporan, ekspor. Hanya tiket yang masuk ke section miliknya.
- Request validasi dan Resource JSON untuk endpoint di atas.
- Tes: buat tiket, hak akses karyawan dan supervisor, setujui / revisi.

### Frontend
- Halaman **registrasi dan login** yang tersambung ke API.
- **Portal karyawan:**
  - Dashboard
  - Pengajuan layanan (langkah 1: pilih section; langkah 2: form dinamis per section)
  - Permintaan Saya
  - Detail permintaan: timeline status, log aktivitas, hasil kerja PIC, panel **Sesuai / Perlu Revisi**
  - Riwayat
  - Profil
- **Portal supervisor:** dashboard, monitoring (+ detail), laporan, pengaturan.
- Lonceng notifikasi.

---

## 3. Tugas Faiz — PIC dan Admin

### Backend
- **Pic:** dashboard, antrean section, tiket yang ia tangani, **accept**, **reject**, update status, **kirim-hasil**, riwayat, laporan pribadi.
- **Admin:** CRUD pengguna, section, layanan, plant, lantai; pemetaan PIC ke section; daftar semua tiket; laporan + ekspor; pengaturan.
- Request validasi dan Resource JSON untuk endpoint di atas.
- Tes: terima ganda (409), PIC beda section (403), siklus kirim hasil, revisi berulang, tutup otomatis.

### Frontend
- **Sesuaikan PIC dan Admin dengan PRD final:**
  - Hapus semua elemen SLA.
  - Ganti "Tandai Selesai" menjadi **"Kirim untuk Ditinjau"**, tambahkan status *Menunggu Konfirmasi*.
  - Ganti format nomor tiket.
  - Hapus kolom *Plant* di halaman PIC Admin.
  - Rapikan tab Settings (hapus SLA dan notifikasi email).
- Tambah halaman **Admin → Lokasi** (plant dan lantai).
- Sambungkan semua halaman PIC dan Admin ke API (ganti penyimpanan localStorage).

---

## 4. Jadwal per sprint

| Sprint | Faiz | Syifa |
|---|---|---|
| **1** | Konfigurasi backend, migrasi, model, seeder, hak akses, rangka `TicketWorkflow`, rapikan komponen bersama | API akun, `api-client`, pengaman halaman, registrasi dan login frontend |
| **2** | CRUD master data Admin (backend + frontend), halaman Lokasi, penyesuaian frontend PIC dan Admin | Endpoint referensi, `TicketNumberGenerator`, `FileUploadService`, buat tiket (API + form 2 langkah), dashboard karyawan, dashboard Supervisor |
| **3** | Endpoint PIC lengkap + sambungan frontend PIC, penyempurnaan `TicketWorkflow`, kirim hasil + pengerjaan revisi | Permintaan Saya, detail, riwayat, **tinjau hasil kerja (setujui / revisi)**, notifikasi, monitoring Supervisor |
| **4** | Laporan Admin + laporan PIC, **job tutup otomatis**, pengujian integrasi | Laporan Supervisor + layanan ekspor, sambungan frontend karyawan dan supervisor ke API, UAT |

---

## 5. Ketergantungan antar tugas

| Siapa menunggu | Menunggu apa | Kapan |
|---|---|---|
| Syifa (API karyawan) | Migrasi dan model Faiz | Akhir Sprint 1 — **ini pekerjaan pertama Faiz** |
| Syifa (aksi setujui / revisi) | `TicketWorkflow` milik Faiz | Sprint 3 — Faiz sebaiknya menyelesaikannya lebih dulu |
| Faiz (laporan Admin dan PIC) | Layanan ekspor milik Syifa | Sprint 4 |
| Syifa (form pengajuan) | Seeder (data section, layanan, lokasi) | Sprint 2 |
| Keduanya (uji alur lengkap) | Backend PIC + backend Karyawan selesai | Sprint 4 |

---

## 6. Aturan kerja bersama (Git)

1. **Satu pemilik per file.** Folder `Employee/` dan `Supervisor/` milik Syifa, `Pic/` dan `Admin/` milik Faiz. Bagian bersama mengikuti tabel nomor 1.
2. **Pisahkan file route per peran** (`routes/api/employee.php`, `pic.php`, `admin.php`, `supervisor.php`) supaya `routes/api.php` tidak menjadi sumber konflik merge.
3. **Perubahan di area bersama** (migrasi, model, `globals.css`, `components/shared`, `lib`) lewat PR kecil dan diberi tahu ke pasangan sebelum digabung.
4. **Urutan merge:** Faiz menggabungkan migrasi dan model ke `dev` lebih dulu. Syifa kemudian menarik `dev` ke branch-nya.
5. **Penamaan branch:** `faiz/<fitur>` dan `syifa/<fitur>`, selalu dibuat dari `dev`, digabung lewat PR ke `dev`. Jangan commit langsung ke `dev` atau `main`.
6. **Kesepakatan bentuk data API:** sebelum Sprint 2, berdua menyepakati nama field di JSON (`judul`, `prioritas`, `plant`, `lantai`, `riwayat`, dan seterusnya) dan menuliskannya di Postman collection pada folder `docs/`.
7. **Tes dikerjakan oleh pemilik endpoint.** Tes alur lintas peran (ajukan → terima → kirim hasil → setujui) dikerjakan berdua di Sprint 4.
8. **`.env` tidak boleh di-commit.** Bagikan `.env.example` yang sudah diperbarui.

---

## 7. Perkiraan beban

- **Faiz:** berat di awal (fondasi backend) dan di tengah (PIC + Admin sekaligus).
- **Syifa:** merata, dan menumpuk di Sprint 3–4 (konfirmasi hasil, laporan, ekspor).
- Jika salah satu terasa terlalu berat, bagian yang paling mudah dipindahkan adalah **layanan ekspor** dan **halaman Lokasi Admin**.
