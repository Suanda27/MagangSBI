# PRD (Product Requirement Document) — Versi Final
# Sistem Informasi Pengajuan & Penanganan Permintaan Layanan Internal
### PT Sumitomo Wiring Systems Batam Indonesia

**Tim:** Syifa Fitria Azizah (3312411067) & Muhammad Faiz Difa Suanda (3312411018)
**Metodologi:** Agile Scrum — 4 Sprint × 3 minggu
**Tech Stack:**
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui, font Inter
- Backend: Laravel 13 (PHP 8.3) — RESTful API, autentikasi Laravel Sanctum mode SPA (cookie)
- Database: MySQL
- Desain UI: Figma / Stitch

---

## 1. Ringkasan Sistem

Sistem ini memusatkan proses **pengajuan, penanganan, dan monitoring permintaan layanan internal** lintas seksi (Assembly, HR, IS, PE, GA) yang sebelumnya terfragmentasi (kertas, telepon, chat). Sistem memiliki 4 peran (role):

| Role | Dikerjakan Oleh | Fungsi Utama |
|---|---|---|
| **Karyawan** (`employee`) | Syifa | Mengajukan tiket, memantau status (self-tracking), meninjau hasil kerja PIC (setuju / minta revisi) |
| **Supervisor** (`supervisor`) | Syifa | Monitoring dashboard, filter, rekap laporan untuk section-nya |
| **PIC** (`pic`) | Faiz | Menerima/menolak tiket, update progres, upload hasil kerja dan mengirimnya untuk ditinjau karyawan, mengerjakan revisi |
| **Administrator** (`admin`) | Faiz | Kelola master data (pengguna, section, layanan, PIC, lokasi) dan pengaturan sistem |

Modul dipecah menjadi **2 PRD terpisah** (Bagian A dan B) sesuai pembagian tanggung jawab tim, namun berbagi **1 database, 1 backend Laravel, dan 1 frontend Next.js** yang sama.

---

## 2. Keputusan Desain (Hasil Klarifikasi)

Keputusan berikut mengikat seluruh isi dokumen ini.

| # | Topik | Keputusan |
|---|---|---|
| D1 | **SLA** | **Tidak ada SLA.** Tidak ada hitung mundur, peringatan batas waktu, atau laporan kepatuhan SLA. Sistem hanya mencatat waktu setiap perubahan status. |
| D2 | **Prioritas** | Tetap ada sebagai **label** (Normal / Tinggi / Mendesak) yang dipilih karyawan. Dipakai hanya untuk mengurutkan antrean PIC, bukan untuk perhitungan waktu. |
| D3 | **Penugasan PIC** | **Antrean bersama per section.** Tiket masuk ke antrean section tujuan. PIC mana pun di section itu dapat menerima; PIC pertama yang menerima menjadi penanggung jawab (`id_pic`). |
| D4 | **Relasi PIC–section** | **Satu PIC = satu section**, disimpan pada `users.id_bagian`. Tidak ada tabel pivot. |
| D5 | **Autentikasi** | **Laravel Sanctum mode SPA (cookie)**, bukan token di browser. Frontend memakai `withCredentials`. |
| D6 | **Tabel akun** | Satu tabel **`users`** dengan kolom `role`. Tabel `karyawan` pada PRD lama diganti `users`. |
| D7 | **Hak karyawan** | Tiket yang sudah diajukan **tidak dapat diedit atau dibatalkan** (jika salah isi, ajukan tiket baru). Karyawan memantau status (self-tracking) dan **meninjau hasil kerja PIC** (D13). |
| D8 | **Notifikasi** | **Hanya di dalam aplikasi** (lonceng). Tidak ada email. |
| D9 | **Pembuatan akun** | Karyawan **mendaftar sendiri dan langsung aktif** sebagai `employee`. Role Supervisor, PIC, dan Admin hanya dapat diberikan oleh Admin. |
| D10 | **Cakupan Supervisor** | **Hanya section miliknya, yaitu section tujuan:** Supervisor melihat tiket yang masuk ke section-nya (`permintaans.id_bagian = users.id_bagian` Supervisor), bukan tiket yang hanya diajukan oleh karyawan section-nya. |
| D11 | **Settings Admin** | Profil, ganti password, dan pengaturan tiket sederhana (batas ukuran & format lampiran). Tab SLA dan notifikasi email **dihapus**. |
| D12 | **Nomor tiket** | **Per section:** `{KODE_SECTION}-{TAHUN}-{URUTAN}`, contoh `GA-2026-0001`. Urutan terpisah per section dan per tahun. |
| D13 | **Konfirmasi hasil kerja** | PIC tidak menutup tiket sendiri. Setelah mengunggah hasil, PIC **mengirimnya untuk ditinjau** (status `waiting_review`). Karyawan pengaju memilih **Sesuai** (tiket ditutup, `completed`) atau **Perlu Revisi** (tiket kembali `in_progress` dan dikerjakan PIC yang sama). Siklus ini dapat berulang. |
| D14 | **Tutup otomatis** | Jika karyawan tidak meninjau dalam **3 hari kerja** sejak hasil dikirim, tiket **ditutup otomatis** (`completed`) dan dicatat di riwayat sebagai "ditutup otomatis oleh sistem". |
| D15 | **Revisi** | **Tanpa batas jumlah.** Saat meminta revisi, karyawan **hanya mengisi alasan teks** (wajib, minimal 10 karakter), tanpa lampiran. |

### Asumsi dan Status Konfirmasi
- **A1.** *(Terkonfirmasi)* "Section milik Supervisor" (D10) = section **tujuan** tiket, yaitu tiket yang masuk ke antrean section yang sama dengan Supervisor tersebut. Bukan section asal pengaju.
- **A2.** *(Belum dikonfirmasi eksplisit)* Tiket berstatus **Completed** atau **Rejected** bersifat final dan tidak dapat diubah lagi.
- **A3.** *(Terkonfirmasi)* Maksimal **5 berkas** untuk lampiran pengajuan dan **5 berkas** untuk bukti penyelesaian per tiket.
- **A4.** *(Belum dikonfirmasi eksplisit)* Jika PIC menolak tiket, `id_pic` diisi PIC yang menolak (sebagai pencatat keputusan).
- **A5.** *(Terkonfirmasi)* "Hari kerja" (D14) = Senin–Jumat. Hari libur nasional/perusahaan belum dikecualikan (dapat ditambahkan kemudian). Hitungan 3 hari kerja dimulai dari waktu hasil **terakhir** dikirim.
- **A6.** *(Belum dikonfirmasi eksplisit)* Setiap pengiriman hasil (termasuk setelah revisi) menambah berkas bukti baru; bukti pada putaran sebelumnya tetap tersimpan dan dapat dilihat di riwayat.
- **A7.** *(Terkonfirmasi)* Revisi selalu kembali ke PIC penanggung jawab yang sama (tidak kembali ke antrean section).

---

## 3. Struktur Folder Proyek

```
sumitomo-ism-system/
│
├── backend/                        # Laravel 13 (RESTful API)
│   ├── app/
│   │   ├── Enums/                   # Role, StatusPermintaan, Prioritas, StatusAkun
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── Auth/            # SHARED (semua role)
│   │   │   │   ├── Referensi/       # SHARED — data dropdown (section, layanan, lokasi)
│   │   │   │   ├── Employee/        # >>> Syifa
│   │   │   │   ├── Supervisor/      # >>> Syifa
│   │   │   │   ├── Pic/             # >>> Faiz
│   │   │   │   └── Admin/           # >>> Faiz
│   │   │   ├── Middleware/EnsureRole.php
│   │   │   ├── Requests/
│   │   │   └── Resources/
│   │   ├── Models/                  # SHARED — 1 model per entitas
│   │   ├── Policies/PermintaanPolicy.php
│   │   └── Services/                # TicketNumberGenerator, TicketWorkflow, FileUploadService
│   ├── database/{migrations,factories,seeders}/
│   ├── routes/api.php
│   └── tests/Feature/
│
├── frontend/                        # Next.js (App Router)
│   ├── src/app/
│   │   ├── (auth)/                  # SHARED: login, register
│   │   ├── (employee)/employee/     # >>> Syifa
│   │   ├── (supervisor)/supervisor/ # >>> Syifa
│   │   ├── (pic)/pic/               # >>> Faiz
│   │   └── (admin)/admin/           # >>> Faiz
│   ├── src/components/
│   │   ├── ui/                      # shadcn/ui primitives (SHARED)
│   │   ├── layout/                  # sidebar, header, wrapper per role
│   │   ├── employee/ supervisor/    # >>> Syifa
│   │   └── pic/ admin/              # >>> Faiz
│   └── src/lib/                     # api-client (axios), store/hook per role, utils
│
└── docs/                            # ERD, wireframe, Postman collection
```

---

# PRD BAGIAN A — MODUL SYIFA
## Modul Karyawan & Supervisor

### A.1 Fitur
**Karyawan**
- Registrasi mandiri & login (langsung aktif sebagai Karyawan)
- Membuat tiket: pilih section → kategori & layanan → lokasi (plant, lantai) → judul, deskripsi, urgensi → lampiran (opsional)
- Memantau daftar, detail, status timeline, dan riwayat tiket (self-tracking)
- **Meninjau hasil kerja PIC:** **Sesuai** (tiket ditutup) atau **Perlu Revisi** (alasan teks wajib; tiket kembali dikerjakan PIC)
- Notifikasi dalam aplikasi saat status tiket berubah
- Profil (ubah nama, email, telepon)

**Supervisor**
- Dashboard ringkasan tiket section-nya
- Monitoring tiket dengan filter tanggal, status, layanan
- Rekap laporan & ekspor PDF/Excel (hanya section-nya)

### A.2 Struktur Folder — Backend
```
app/Http/Controllers/Api/
├── Auth/
│   ├── RegisterController.php        # registrasi karyawan (role=employee)
│   ├── LoginController.php           # login, logout, me
│   └── ProfileController.php         # ubah profil, ganti password
├── Referensi/ReferensiController.php # sections, layanan per section, lokasi
├── Employee/
│   ├── DashboardController.php       # ringkasan angka
│   ├── PermintaanController.php      # index, store, show (milik sendiri)
│   ├── KonfirmasiController.php      # setujui hasil / minta revisi
│   └── RiwayatController.php         # log aktivitas tiket milik sendiri
├── NotifikasiController.php          # daftar & tandai dibaca (semua role)
└── Supervisor/
    ├── DashboardController.php
    ├── MonitoringController.php      # index + filter, show
    └── LaporanController.php         # rekap + export

app/Http/Requests/Employee/StorePermintaanRequest.php
app/Http/Requests/Employee/RevisiRequest.php
app/Http/Requests/Supervisor/FilterLaporanRequest.php
app/Http/Resources/PermintaanResource.php, RiwayatPermintaanResource.php, LampiranResource.php
```

### A.3 Struktur Folder — Frontend
```
src/app/(auth)/
├── login/page.tsx
└── register/page.tsx

src/app/(employee)/employee/
├── dashboard/page.tsx
├── pengajuan-layanan/
│   ├── page.tsx                      # langkah 1: pilih section
│   └── [section]/page.tsx            # langkah 2: form dinamis per section
├── permintaan-saya/page.tsx
├── permintaan-saya/[id]/page.tsx     # detail + status timeline + panel tinjau hasil (Sesuai / Perlu Revisi)
├── riwayat/page.tsx
└── profil/page.tsx

src/app/(supervisor)/supervisor/
├── dashboard/page.tsx
├── monitoring-permintaan/page.tsx
├── monitoring-permintaan/[id]/page.tsx
├── laporan/page.tsx
└── pengaturan/page.tsx
```

### A.4 Sprint Plan — Modul Karyawan & Supervisor
| Sprint | Durasi | Fokus | Deliverable |
|---|---|---|---|
| **Sprint 1** | 3 minggu | Setup repo, ERD & migrasi final (Bagian 5), seeder, wireframe, auth Sanctum SPA + RBAC | Skema DB final, login/registrasi jalan |
| **Sprint 2** | 3 minggu | Karyawan: form pengajuan per section, upload lampiran, generator nomor tiket; Supervisor: dashboard | Karyawan bisa submit tiket; Supervisor melihat dashboard |
| **Sprint 3** | 3 minggu | "Permintaan Saya", status timeline, riwayat, notifikasi, **tinjau hasil kerja (setujui / revisi)**; Supervisor: monitoring + filter | Self-tracking dan konfirmasi hasil end-to-end; filter monitoring berfungsi |
| **Sprint 4** | 3 minggu | Laporan + ekspor PDF/Excel; ganti penyimpanan lokal frontend dengan API; Black-box Testing & UAT | Laporan dapat diekspor; sistem terintegrasi penuh |

---

# PRD BAGIAN B — MODUL FAIZ
## Modul Administrator & PIC

### B.1 Fitur
**PIC**
- Antrean tiket section-nya (urut: prioritas Mendesak → Tinggi → Normal, lalu terlama dulu), pencarian & filter
- Terima atau tolak tiket (tolak wajib beralasan)
- Update progres: Sedang Diproses ↔ Pending (Pending wajib beralasan)
- Upload hasil kerja (minimal 1 bukti) dan **kirim untuk ditinjau** karyawan; kerjakan ulang bila karyawan meminta revisi
- Daftar tiket yang ditangani (Sedang Diproses, Pending, Menunggu Konfirmasi), riwayat (selesai & ditolak), laporan kinerja pribadi
- Profil & notifikasi dalam aplikasi

**Admin**
- CRUD pengguna & penetapan role; menonaktifkan akun
- CRUD section, katalog layanan, master lokasi (plant & lantai)
- Pemetaan PIC ke section
- Melihat seluruh tiket (semua section)
- Rekap laporan menyeluruh + ekspor
- Settings: profil, ganti password, pengaturan tiket sederhana

### B.2 Struktur Folder — Backend
```
app/Http/Controllers/Api/
├── Pic/
│   ├── DashboardController.php       # ringkasan angka
│   ├── AntreanController.php         # antrean section + daftar tiket milik PIC
│   ├── PenangananController.php      # accept, reject, update status
│   ├── PenyelesaianController.php    # upload hasil + kirim untuk ditinjau (waiting_review)
│   └── LaporanController.php         # laporan kinerja pribadi
└── Admin/
    ├── UserController.php            # CRUD akun & role
    ├── SectionController.php         # CRUD section
    ├── LayananController.php         # CRUD layanan
    ├── LokasiController.php          # CRUD plant & lantai
    ├── PicMappingController.php      # tetapkan PIC ke section
    ├── PermintaanController.php      # global view (read-only)
    ├── LaporanController.php         # rekap + export
    └── PengaturanController.php      # settings sistem

app/Http/Requests/Pic/{RejectRequest,UpdateStatusRequest,KirimHasilRequest}.php
app/Http/Requests/Admin/{StoreUserRequest,UpdateUserRequest,StoreSectionRequest,StoreLayananRequest}.php
app/Http/Resources/AntreanResource.php, UserResource.php
app/Console/Commands/TutupOtomatisTiket.php   # job harian: tutup otomatis tiket tanpa tinjauan 3 hari kerja (D14)
```

### B.3 Struktur Folder — Frontend
```
src/app/(pic)/pic/
├── dashboard/page.tsx
├── permintaan-masuk/page.tsx         # antrean section + panel "Periksa", terima/tolak
├── sedang-diproses/page.tsx          # tiket milik PIC (In Progress, Pending, Menunggu Konfirmasi)
├── selesai/page.tsx                  # riwayat: Completed & Rejected
├── permintaan/[id]/page.tsx          # detail + update status + upload hasil + kirim untuk ditinjau
├── laporan/page.tsx                  # laporan kinerja pribadi
└── profil/page.tsx

src/app/(admin)/admin/
├── dashboard/page.tsx
├── pengguna/page.tsx  pengguna/tambah/page.tsx  pengguna/[id]/page.tsx  pengguna/[id]/edit/page.tsx
├── section/page.tsx  section/tambah/page.tsx
├── layanan/page.tsx  layanan/tambah/page.tsx
├── pic/page.tsx  pic/tambah/page.tsx            # pemetaan PIC ke section
├── lokasi/page.tsx                              # plant & lantai  (BARU, belum ada)
├── permintaan/page.tsx  permintaan/[id]/page.tsx
├── laporan/page.tsx
└── settings/page.tsx
```

### B.4 Sprint Plan — Modul Administrator & PIC
| Sprint | Durasi | Fokus | Deliverable |
|---|---|---|---|
| **Sprint 1** | 3 minggu | Setup repo, ERD & migrasi final, mockup Admin & PIC, auth + RBAC | Skema DB final, login berfungsi |
| **Sprint 2** | 3 minggu | Admin: CRUD pengguna, section, layanan, lokasi, pemetaan PIC, settings | Admin dapat mengelola seluruh master data |
| **Sprint 3** | 3 minggu | PIC: antrean section, terima/tolak, update status, upload hasil & kirim untuk ditinjau, pengerjaan revisi, laporan pribadi | PIC memproses tiket end-to-end sampai disetujui karyawan |
| **Sprint 4** | 3 minggu | Laporan Admin (filter + ekspor), penjadwal tutup otomatis, integrasi API dengan modul Syifa, System Integration Testing & Black-box Testing | Laporan Admin lengkap; sistem terintegrasi penuh |

---

## 4. Alur Status Tiket

### 4.1 Status
| Status (database) | Label di aplikasi | Keterangan |
|---|---|---|
| `submitted` | Diajukan (karyawan) / Menunggu Pemeriksaan (PIC) | Baru diajukan, belum ada PIC |
| `in_progress` | Sedang Diproses | Sudah diterima PIC, sedang dikerjakan (juga setelah revisi diminta) |
| `pending` | Pending | Ditunda, menunggu pihak lain (wajib ada alasan) |
| `waiting_review` | Menunggu Konfirmasi | PIC sudah mengirim hasil kerja; menunggu karyawan meninjau |
| `completed` | Selesai | Disetujui karyawan atau ditutup otomatis (**final**) |
| `rejected` | Ditolak | Ditolak PIC dengan alasan (**final**) |

### 4.2 Transisi yang Diizinkan (divalidasi di server)
```
submitted ──accept──▶ in_progress ◀──▶ pending
    │                    │  ▲             │
    └──reject──▶ rejected│  │revisi       │
                         ▼  │             ▼
                    kirim hasil (PIC) ────┘
                         ▼
                  waiting_review ──setujui / tutup otomatis──▶ completed
                         │
                         └──revisi (karyawan)──▶ in_progress
```

| Aksi | Pelaku | Syarat dan akibat |
|---|---|---|
| `accept` | PIC | Status `submitted`; `id_pic` masih kosong; section PIC = section tujuan tiket. Atomik: bila PIC lain lebih dulu menerima, server menjawab **409**. |
| `reject` | PIC | Status `submitted`; alasan wajib (minimal 10 karakter). |
| `update status` | PIC penanggung jawab | `in_progress` ↔ `pending`; alasan wajib saat ke `pending` (minimal 5 karakter). |
| `kirim hasil` | PIC penanggung jawab | Status `in_progress`/`pending`; minimal **1 bukti** (foto/PDF); catatan opsional (maks. 500 karakter). Status → `waiting_review`, `dikirim_pada` diisi. |
| `setujui` | Karyawan pengaju | Status `waiting_review`. Status → `completed`, `selesai_pada` diisi. |
| `revisi` | Karyawan pengaju | Status `waiting_review`; **alasan teks wajib** (minimal 10 karakter), tanpa lampiran (D15). Status → `in_progress` (PIC yang sama), `jumlah_revisi` bertambah. **Tanpa batas.** |
| `tutup otomatis` | Sistem (job harian) | Status `waiting_review` dan sudah lewat **3 hari kerja** sejak `dikirim_pada` (D14, A5). Status → `completed`; riwayat dicatat tanpa pelaku (Sistem). |

Setiap transisi menulis satu baris `riwayat_permintaans` dan memicu notifikasi dalam aplikasi sesuai tabel 4.3.

### 4.3 Notifikasi dalam Aplikasi
| Peristiwa | Penerima |
|---|---|
| Tiket baru diajukan | Semua PIC aktif di section tujuan |
| Tiket diterima / ditolak / ditunda / dilanjutkan | Karyawan pengaju |
| **Hasil kerja dikirim** (perlu ditinjau) | Karyawan pengaju |
| **Revisi diminta** | PIC penanggung jawab |
| **Hasil disetujui** | PIC penanggung jawab |
| **Ditutup otomatis** | Karyawan pengaju dan PIC penanggung jawab |

### 4.4 Matriks Hak Akses
| Aksi | Karyawan | PIC | Supervisor | Admin |
|---|---|---|---|---|
| Buat tiket | Ya | — | — | — |
| Lihat tiket | Milik sendiri | Antrean section-nya + tiket yang ia tangani | Tiket section-nya | Semua |
| Terima / tolak / update status / kirim hasil | — | Ya (sesuai syarat 4.2) | — | — |
| **Setujui / minta revisi** | **Ya (tiket miliknya, saat `waiting_review`)** | — | — | — |
| Laporan | — | Kinerja pribadi | Section-nya | Semua section |
| Kelola master data & pengguna | — | — | — | Ya |
| Ubah profil sendiri | Ya | Ya | Ya | Ya |

---

## 5. Database (MySQL)

Konvensi: semua tabel memakai `id` (bigint), `created_at`, `updated_at`. **Tidak ada `cascadeOnDelete` ke tabel transaksi** — master data tidak dihapus, melainkan dinonaktifkan (`status = nonaktif`), dan relasi memakai `restrictOnDelete`.

### 5.1 Daftar Tabel
| Tabel | Kolom | Catatan |
|---|---|---|
| **`users`** | `nik` (unik), `name`, `email` (unik), `password` (hash), `role` (`employee`/`supervisor`/`pic`/`admin`, default `employee`), `id_bagian` (FK → bagians, nullable), `jabatan`, `telepon`, `status` (`aktif`/`nonaktif`, default `aktif`) | Satu tabel untuk semua role (D6). `id_bagian` = section karyawan; untuk PIC/Supervisor = section tugasnya. |
| **`bagians`** | `kode_bagian` (unik: ASM, HR, IS, PE, GA), `nama_bagian`, `deskripsi`, `status` | Master section. Kode dipakai pada nomor tiket. |
| **`layanans`** | `kode_layanan` (unik), `nama_layanan`, `kategori`, `deskripsi`, `id_bagian` (FK), `status` | Katalog layanan; menentukan section tujuan. |
| **`plants`** | `nama_plant` | Master lokasi. |
| **`lantais`** | `nama_lantai`, `id_plant` (FK) | Master lokasi. |
| **`permintaans`** | `kode_tiket` (unik), `id_karyawan` (FK users, pengaju), `id_layanan` (FK), `id_bagian` (FK, section **tujuan**, disalin dari layanan saat tiket dibuat), `id_pic` (FK users, nullable), `id_plant` (FK), `id_lantai` (FK), `lokasi_detail`, `judul`, `deskripsi`, `prioritas` (`normal`/`tinggi`/`mendesak`), `status` (lihat 4.1, default `submitted`), `diterima_pada`, `ditolak_pada`, `dikirim_pada` (waktu hasil kerja terakhir dikirim; dasar hitungan tutup otomatis), `selesai_pada`, `jumlah_revisi` (default 0), `alasan_tolak`, `alasan_pending`, `alasan_revisi` (revisi terakhir), `catatan_hasil` (catatan PIC pada kiriman terakhir) | `id_bagian` disimpan agar antrean per section cepat dan tetap benar bila layanan dipindah section. Indeks: `status`, `id_pic`, `id_karyawan`, `id_bagian`, `created_at`. |
| **`riwayat_permintaans`** | `id_permintaan` (FK), `id_user` (FK users, **nullable**; kosong = Sistem), `status`, `aksi` (`submitted`/`accepted`/`rejected`/`paused`/`resumed`/`result_sent`/`revision_requested`/`approved`/`auto_closed`), `keterangan` | Satu baris per perubahan status; sumber timeline dan riwayat. `aksi` membedakan, misalnya, "revisi diminta" dari "dilanjutkan" meski status sama-sama `in_progress`. |
| **`lampirans`** | `id_permintaan` (FK), `id_user` (FK, pengunggah), `jenis` (`pengajuan`/`penyelesaian`), `putaran` (nullable; untuk `penyelesaian` = pengiriman ke-n, mulai 1), `nama_file`, `path_file`, `tipe_file` (MIME), `ukuran_file` (byte, integer) | Disimpan di disk **private**. |
| **`urutan_tikets`** | `id_bagian` (FK), `tahun`, `terakhir` (integer) — unik pada (`id_bagian`, `tahun`) | Penghitung nomor tiket per section per tahun (D12), dikunci dengan `lockForUpdate`. |
| **`pengaturans`** | `kunci` (unik), `nilai` | Pengaturan sistem (D11). Kunci: `max_upload_mb` (default 5, rentang 1–5), `format_lampiran` (default `jpg,png,pdf`), `digit_nomor_tiket` (default 4). |
| **`notifications`** | Tabel notifikasi bawaan Laravel | Notifikasi dalam aplikasi (D8). |
| Tabel framework | `sessions`, `cache`, `jobs`, `password_reset_tokens` (sudah ada) | `personal_access_tokens` ikut dibuat oleh `install:api` namun tidak dipakai pada mode SPA. |

### 5.2 Relasi Inti
```
bagians 1─∞ users            bagians 1─∞ layanans        bagians 1─∞ permintaans (tujuan)
users 1─∞ permintaans (pengaju)   users 1─∞ permintaans (id_pic)
layanans 1─∞ permintaans     plants 1─∞ lantais          lantais 1─∞ permintaans
permintaans 1─∞ riwayat_permintaans     permintaans 1─∞ lampirans
```

### 5.3 Nomor Tiket
Format `{kode_bagian}-{tahun}-{urutan 4 digit}` → `GA-2026-0001`, `IS-2026-0014`. Dibuat server saat `POST /employee/permintaan`, di dalam satu transaksi bersama penulisan tiket dan riwayat pertama (`submitted`). Karyawan **tidak** dapat menentukan nomor tiket.

---

## 6. Endpoint API

Prefix `/api`. Semua jawaban berformat JSON melalui API Resource. Daftar memakai **pagination** (`?page=&per_page=`). Autentikasi: Sanctum SPA — frontend memanggil `GET /sanctum/csrf-cookie` sebelum login.

### 6.1 Autentikasi & Akun (semua role)
```
GET    /sanctum/csrf-cookie
POST   /api/auth/register            # membuat akun role=employee, status=aktif (D9)
POST   /api/auth/login               # dibatasi 5 percobaan/menit
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/me                  # ubah nama, email, telepon
PATCH  /api/auth/password            # ganti password

GET    /api/notifikasi               # notifikasi milik pengguna (?belum_dibaca=1)
POST   /api/notifikasi/baca          # tandai dibaca
```

### 6.2 Data Referensi (semua role yang sudah login)
```
GET    /api/referensi/sections               # section aktif
GET    /api/referensi/layanan?bagian={id}    # layanan aktif per section, dikelompokkan per kategori
GET    /api/referensi/lokasi                 # plant beserta lantainya
GET    /api/lampiran/{id}                    # unduh berkas (dicek oleh Policy)
```

### 6.3 Karyawan
```
GET    /api/employee/dashboard                # jumlah tiket per status + 5 terbaru
GET    /api/employee/permintaan?status=&q=&layanan=&page=
POST   /api/employee/permintaan               # multipart: data tiket + lampiran[]
GET    /api/employee/permintaan/{id}          # detail + riwayat + lampiran + hasil kerja PIC
POST   /api/employee/permintaan/{id}/setujui  # hasil sesuai → completed (hanya saat waiting_review)
POST   /api/employee/permintaan/{id}/revisi   # body: alasan (min. 10 karakter) → kembali in_progress
GET    /api/employee/riwayat?status=&bulan=   # log aktivitas seluruh tiket milik sendiri
```

### 6.4 Supervisor (hanya section-nya — A1)
```
GET    /api/supervisor/dashboard
GET    /api/supervisor/permintaan?status=&layanan=&dari=&sampai=&q=
GET    /api/supervisor/permintaan/{id}
GET    /api/supervisor/laporan?dari=&sampai=
GET    /api/supervisor/laporan/export?format=pdf|excel&dari=&sampai=
```

### 6.5 PIC
```
GET    /api/pic/dashboard
GET    /api/pic/antrean?q=&layanan=&prioritas=            # status submitted, section PIC, urut prioritas lalu terlama
GET    /api/pic/permintaan?status=in_progress,pending,waiting_review   # tiket yang ia tangani
GET    /api/pic/permintaan/{id}
POST   /api/pic/permintaan/{id}/accept                    # 409 bila sudah diambil PIC lain
POST   /api/pic/permintaan/{id}/reject                    # body: alasan
PATCH  /api/pic/permintaan/{id}/status                    # body: status (in_progress|pending), alasan
POST   /api/pic/permintaan/{id}/kirim-hasil               # multipart: bukti[], catatan → waiting_review
GET    /api/pic/riwayat?status=completed,rejected
GET    /api/pic/laporan?dari=&sampai=                     # kinerja pribadi
```

### 6.6 Administrator
```
GET|POST        /api/admin/users                    GET|PATCH /api/admin/users/{id}    # nonaktifkan lewat status, tanpa DELETE
GET|POST        /api/admin/sections                 PATCH     /api/admin/sections/{id}
GET|POST        /api/admin/layanan                  PATCH     /api/admin/layanan/{id}
GET|POST        /api/admin/plants                   PATCH     /api/admin/plants/{id}
GET|POST        /api/admin/lantais                  PATCH     /api/admin/lantais/{id}
GET             /api/admin/pic-mapping              # daftar PIC beserta section
POST            /api/admin/pic-mapping              # body: user_id, id_bagian → role=pic
PATCH|DELETE    /api/admin/pic-mapping/{user}       # ubah section / kembalikan ke employee
GET             /api/admin/permintaan?section=&status=&q=&dari=&sampai=
GET             /api/admin/permintaan/{id}
GET             /api/admin/laporan?dari=&sampai=&section=
GET             /api/admin/laporan/export?format=pdf|excel&dari=&sampai=&section=
GET|PATCH       /api/admin/pengaturan
```

### 6.7 Konvensi Respons & Kesalahan
| Kode | Arti |
|---|---|
| 200 / 201 | Berhasil / dibuat |
| 401 | Belum login |
| 403 | Role atau kepemilikan tidak sesuai (Policy) |
| 404 | Tidak ditemukan |
| 409 | Konflik (tiket sudah diterima PIC lain, atau status tiket sudah berubah sehingga aksi tidak berlaku lagi) |
| 422 | Validasi gagal — berisi `errors` per field, pesan berbahasa Indonesia |

---

## 7. Isi Laporan

Tanpa SLA (D1), laporan memuat: jumlah tiket per status, per layanan, per kategori; **rata-rata durasi penyelesaian** (selesai dikurangi diajukan); **rata-rata jumlah revisi** per tiket; jumlah tiket yang **ditutup otomatis**; tren tiket per periode; dan daftar tiket. Cakupan data: PIC → tiket yang ia tangani; Supervisor → section-nya; Admin → semua section (dengan filter section). Ekspor **PDF dan Excel**.

---

## 8. Penyesuaian Frontend yang Sudah Dibuat

Berdasarkan keputusan di Bagian 2, bagian berikut pada frontend perlu disesuaikan:

| Area | Penyesuaian |
|---|---|
| **PIC** | Hapus hitung mundur & kolom SLA, badge "mendekati batas SLA", kartu "Kepatuhan SLA" pada laporan. Urutan antrean: prioritas lalu waktu pengajuan. Hapus kejadian "Dialokasikan ke Antrean PIC" (diganti satu kejadian `submitted`). |
| **Admin — Settings** | Hapus tab *Tiket & SLA* bagian SLA, tab *Notifikasi* (email), dan input prefix nomor tiket (prefix = kode section). Sisakan: profil, keamanan (ganti password), batas ukuran & format lampiran. Hapus kebijakan keamanan yang belum didukung backend (2FA, batas sesi) atau tandai "segera hadir". |
| **Admin — PIC** | Hapus kolom *Plant* (PIC hanya terkait section). |
| **Admin — Lokasi** | Tambahkan halaman kelola plant & lantai (belum ada). |
| **Nomor tiket** | Ganti format `SRV-2026-0001` menjadi `{KODE_SECTION}-{TAHUN}-{URUTAN}`. |
| **PIC — kirim hasil** | Ubah tombol "Tandai Selesai" menjadi **"Kirim untuk Ditinjau"**; tambahkan status *Menunggu Konfirmasi* pada daftar *Sedang Diproses*; tampilkan alasan revisi terakhir dan pengiriman ke-n di halaman detail; tambahkan langkah "Ditinjau" pada stepper; halaman *Selesai* hanya memuat tiket Completed & Rejected. |
| **Karyawan — tinjau hasil** | Pada detail tiket berstatus *Menunggu Konfirmasi*, tampilkan hasil kerja PIC (catatan + bukti) dengan tombol **Sesuai** dan **Perlu Revisi** (isian alasan teks wajib, tanpa lampiran); tambahkan status baru pada badge, timeline, dan notifikasi ("hasil kerja siap ditinjau"). |
| **Karyawan & PIC** | Ganti penyimpanan localStorage dengan pemanggilan `axios` (Sprint 4). |

---

## 9. Standar Non-Fungsional Bersama
- **Konfigurasi:** MySQL; zona waktu `Asia/Jakarta`; bahasa `id`; CORS hanya untuk origin frontend; `SANCTUM_STATEFUL_DOMAINS` dan `SESSION_DOMAIN` diatur pada `.env` (jangan commit `.env`).
- **Penjadwal:** perintah `tiket:tutup-otomatis` dijalankan harian lewat Laravel Scheduler (pada Windows/intranet: Task Scheduler memanggil `php artisan schedule:run` tiap menit).
- **Keamanan:** password di-hash (bcrypt), Sanctum SPA (cookie + CSRF), RBAC lewat `EnsureRole` + `PermintaanPolicy`, pembatasan percobaan login, semua transisi status divalidasi di server.
- **File upload:** JPG, PNG, PDF; maksimal 5 MB per berkas; disimpan di disk private dengan nama acak dan diunduh lewat endpoint terproteksi.
- **Kualitas:** feature test (PHPUnit) untuk login, hak akses per role, alur terima → proses → kirim hasil → setujui/revisi (berulang), tutup otomatis 3 hari kerja, validasi upload, dan konflik penerimaan ganda; Black-box Testing per modul + System Integration Testing di Sprint 4.
- **Data awal:** seeder berisi 5 section, katalog layanan, plant/lantai, dan satu akun per role.
- **Dokumentasi:** ERD, wireframe, dan Postman collection di folder `docs/`.
- **Deployment:** standalone/intranet, tidak terhubung ke server produksi korporat (MySBI).

---

## 10. Titik Integrasi Antar-Modul (Sprint 4 — Bersama)

| Titik Integrasi | Modul Syifa | Modul Faiz |
|---|---|---|
| Tiket dibuat Karyawan → masuk antrean PIC | `POST /employee/permintaan` menulis `permintaans` (`id_bagian` tujuan) | `GET /pic/antrean` membaca tiket `submitted` section PIC |
| Update status PIC → terlihat di self-tracking & monitoring | Membaca `riwayat_permintaans` & notifikasi | Menulis `riwayat_permintaans` & mengirim notifikasi |
| Hasil kerja PIC → ditinjau karyawan (setujui / revisi) | `POST /employee/permintaan/{id}/setujui` dan `/revisi` | `POST /pic/permintaan/{id}/kirim-hasil`; mengerjakan ulang bila ada revisi |
| Master data dari Admin → dipakai form pengajuan | `GET /referensi/*` (baca) | CRUD section, layanan, lokasi (tulis) |
| Role & hak akses | Middleware `EnsureRole` (shared) | `admin/users` & `admin/pic-mapping` sebagai sumber role |

---

## 11. Riwayat Revisi Dokumen
| Perubahan dari versi sebelumnya |
|---|
| Menambahkan **Keputusan Desain D1–D12** dan asumsi A1–A4. |
| **Menghapus SLA**; menambahkan prioritas sebagai label. |
| Mengganti tabel `karyawan` dengan `users` (kolom role); menambah kolom `jabatan`, `telepon`, `status`, `kode_bagian`, `kode_layanan`, `judul`, `prioritas`, `id_bagian` tujuan, `id_plant`, `id_lantai`, alasan & waktu status pada tiket. |
| Menambah tabel `urutan_tikets`, `pengaturans`, `notifications`; riwayat dengan aktor boleh kosong (Sistem). |
| Mengganti `cascadeOnDelete` dengan `restrictOnDelete` dan penonaktifan master data. |
| Menambah Bagian 4 (alur status & hak akses), Bagian 5 (spesifikasi database), Bagian 6 (API lengkap), Bagian 7 (laporan), Bagian 8 (penyesuaian frontend). |
| Memperbarui versi: Laravel 11 → 13, Next.js 16, Sanctum SPA; menyelaraskan struktur folder frontend dengan implementasi (`permintaan-masuk`, `sedang-diproses`, `selesai`, `permintaan-saya`, `profil`). |
| Menambah endpoint referensi, notifikasi, profil, laporan PIC, dan pengelolaan lokasi. |
| **Revisi ke-2:** menambah alur **konfirmasi hasil kerja** (D13–D15): status `waiting_review`, aksi setujui/revisi oleh karyawan, tutup otomatis 3 hari kerja, kolom `dikirim_pada`, `jumlah_revisi`, `alasan_revisi`, `catatan_hasil`, `riwayat.aksi`, `lampirans.putaran`; mengganti endpoint `selesaikan` menjadi `kirim-hasil`; mengubah D7 (karyawan tidak lagi "hanya melihat"). |
