# PRD (Product Requirement Document)
# Sistem Informasi Pengajuan & Penanganan Permintaan Layanan Internal
### PT Sumitomo Wiring Systems Batam Indonesia

**Tim:** Syifa Fitria Azizah (3312411067) & Muhammad Faiz Difa Suanda (3312411018)
**Metodologi:** Agile Scrum — 4 Sprint × 3 minggu
**Tech Stack:** Next.js/React + Tailwind CSS + shadcn/ui (Frontend) · Laravel RESTful API (Backend) · MySQL (Database) · Figma (Desain UI)

---

## 1. Ringkasan Sistem

Sistem ini memusatkan proses **pengajuan, penanganan, dan monitoring permintaan layanan internal** lintas seksi (Assembly, HR, IS, PE, GA) yang sebelumnya terfragmentasi (kertas, telepon, chat). Sistem memiliki 4 peran (role):

| Role | Dikerjakan Oleh | Fungsi Utama |
|---|---|---|
| **Karyawan** | Syifa | Mengajukan tiket, melacak status (self-tracking) |
| **Supervisor** | Syifa | Monitoring dashboard, filter, rekap laporan |
| **PIC (Person in Charge)** | Faiz | Menerima & mengerjakan tiket, update progres |
| **Administrator** | Faiz | Kelola master data (user, section, layanan, PIC) |

Modul dipecah menjadi **2 PRD terpisah** sesuai pembagian tanggung jawab tim, namun berbagi **1 database, 1 backend Laravel, dan 1 frontend Next.js** yang sama (monorepo/terpadu saat integrasi Sprint 4).

---

## 2. Struktur Folder Proyek (Level Tim / Root Repository)

```
sumitomo-ism-system/
│
├── backend/                        # Laravel 11 (RESTful API)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── Auth/            # SHARED (dipakai semua role)
│   │   │   │   ├── Employee/        # >>> milik Syifa
│   │   │   │   ├── Supervisor/      # >>> milik Syifa
│   │   │   │   ├── Pic/             # >>> milik Faiz
│   │   │   │   └── Admin/           # >>> milik Faiz
│   │   │   ├── Requests/
│   │   │   ├── Resources/
│   │   │   └── Middleware/RoleMiddleware.php
│   │   ├── Models/                  # SHARED — 1 model per entitas ERD
│   │   └── Services/                # TicketNumberGenerator, FileUploadService
│   ├── database/
│   │   ├── migrations/              # SHARED
│   │   └── seeders/
│   └── routes/api.php
│
├── frontend/                        # Next.js (App Router)
│   ├── src/app/
│   │   ├── (auth)/                  # SHARED: login, register
│   │   ├── (employee)/              # >>> milik Syifa
│   │   ├── (supervisor)/            # >>> milik Syifa
│   │   ├── (pic)/                   # >>> milik Faiz
│   │   └── (admin)/                 # >>> milik Faiz
│   ├── src/components/
│   │   ├── ui/                      # shadcn/ui primitives (SHARED)
│   │   ├── employee/  supervisor/   # >>> milik Syifa
│   │   └── pic/  admin/             # >>> milik Faiz
│   └── src/lib/  (api-client, hooks, utils)  # SHARED
│
└── docs/  (ERD, wireframe Figma, Postman collection)
```

---

# PRD BAGIAN A — MODUL SAYA (Syifa)
## Modul Karyawan & Supervisor

### A.1 Fitur (mengacu FR-06 s/d FR-18)
- Registrasi & login akun Karyawan
- Membuat tiket permintaan layanan (pilih section, kategori, upload lampiran)
- Melihat daftar, detail, dan status/riwayat permintaan (self-tracking)
- Dashboard monitoring Supervisor (ringkasan, filter tanggal/section/status)
- Rekapitulasi & ekspor laporan (PDF/Excel)

### A.2 Struktur Folder — Backend (Laravel)
```
app/Http/Controllers/Api/
├── Employee/
│   ├── PermintaanController.php      # store, index, show (tiket milik sendiri)
│   ├── RiwayatController.php         # riwayat & status history
│   └── ProfileController.php
└── Supervisor/
    ├── MonitoringController.php      # index + filter (tanggal/section/status)
    ├── DashboardController.php       # statistik ringkasan
    └── LaporanController.php         # rekap + export (PDF/Excel)

app/Http/Requests/
├── Employee/StorePermintaanRequest.php
└── Supervisor/FilterLaporanRequest.php

app/Http/Resources/
├── PermintaanResource.php
└── RiwayatPermintaanResource.php

app/Services/
├── TicketNumberGenerator.php         # generate Ticket ID unik otomatis
└── FileUploadService.php             # validasi JPG/PNG/PDF max 5MB
```

### A.3 Struktur Folder — Frontend (Next.js)
```
src/app/(employee)/
├── dashboard/page.tsx
├── pengajuan-layanan/
│   ├── page.tsx                      # pilih section (Assy/HR/IS/PE/GA)
│   └── [section]/page.tsx            # form dinamis per section
├── permintaan-saya/page.tsx
├── permintaan-saya/[id]/page.tsx     # detail + status timeline
├── riwayat/page.tsx
└── profile/page.tsx

src/app/(supervisor)/
├── dashboard/page.tsx
├── monitoring-permintaan/page.tsx
├── monitoring-permintaan/[id]/page.tsx
├── laporan/page.tsx
└── pengaturan/page.tsx

src/components/employee/  (TicketForm, StatusTimeline, TicketCard)
src/components/supervisor/ (StatCard, FilterBar, MonitoringTable, ExportButton)
```

### A.4 Database (tabel yang dipakai modul ini)
| Tabel | Peran dalam Modul |
|---|---|
| `karyawan` | Akun & profil pengguna (role: employee/supervisor) |
| `permintaan` | Tiket yang diajukan Karyawan, dipantau Supervisor |
| `riwayat_permintaan` | Log status untuk self-tracking & timeline |
| `lampiran` | File bukti pendukung dari Karyawan |
| `bagian`, `layanan`, `plant`, `lantai` | Data referensi (read-only bagi modul ini) |

### A.5 Endpoint API
```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/employee/permintaan
POST   /api/employee/permintaan
GET    /api/employee/permintaan/{id}
GET    /api/employee/riwayat

GET    /api/supervisor/dashboard
GET    /api/supervisor/permintaan?section=&status=&tanggal=
GET    /api/supervisor/permintaan/{id}
GET    /api/supervisor/laporan?periode=
GET    /api/supervisor/laporan/export?format=pdf|excel
```

### A.6 Sprint Plan — Modul Karyawan & Supervisor
| Sprint | Durasi | Fokus | Deliverable |
|---|---|---|---|
| **Sprint 1** | 3 minggu | Setup repo, ERD & migrasi DB, wireframe Figma (Karyawan+Supervisor), auth + RBAC | Skema DB, mockup high-fidelity, login/registrasi jalan |
| **Sprint 2** | 3 minggu | Modul Karyawan: form pengajuan tiket per section, upload lampiran, generate Ticket ID; Modul Supervisor: dashboard ringkasan | Karyawan bisa submit tiket; Supervisor lihat dashboard |
| **Sprint 3** | 3 minggu | Halaman "Permintaan Saya", status timeline (self-tracking), riwayat; Supervisor: monitoring + filter (tanggal/section/status) | Self-tracking end-to-end; filter monitoring berfungsi |
| **Sprint 4** | 3 minggu | Rekap laporan + export PDF/Excel; integrasi API dengan modul Admin/PIC milik Faiz; Black-box Testing & UAT | Laporan bisa diekspor; sistem terintegrasi penuh |

---

# PRD BAGIAN B — MODUL REKAN SAYA (Faiz)
## Modul Administrator & PIC (Person in Charge)

### B.1 Fitur (mengacu FR-06 s/d FR-19)
- PIC: lihat antrean tiket per section, accept/reject, update status (In Progress/Pending), upload bukti & selesaikan tiket
- Admin: CRUD user, section, katalog layanan, pemetaan PIC ke section
- Admin: rekapitulasi laporan menyeluruh + export

### B.2 Struktur Folder — Backend (Laravel)
```
app/Http/Controllers/Api/
├── Pic/
│   ├── AntreanController.php         # index tiket sesuai section PIC
│   ├── PenangananController.php      # accept/reject, update status
│   └── PenyelesaianController.php    # upload bukti + set Completed
└── Admin/
    ├── UserController.php            # CRUD akun & role
    ├── SectionController.php         # CRUD Assy/HR/IS/PE/GA
    ├── LayananController.php         # CRUD kategori/sub-kategori layanan
    ├── PicMappingController.php      # penugasan PIC ke section
    └── LaporanController.php         # rekap menyeluruh + export

app/Http/Requests/
├── Pic/UpdateStatusRequest.php
├── Pic/SelesaikanPermintaanRequest.php
└── Admin/StoreUserRequest.php

app/Http/Resources/
├── AntreanResource.php
└── UserResource.php
```

### B.3 Struktur Folder — Frontend (Next.js)
```
src/app/(pic)/
├── dashboard/page.tsx
├── antrean/page.tsx                  # daftar tiket masuk seksi
├── antrean/[id]/page.tsx             # detail + tombol accept/reject
├── pengerjaan/[id]/update/page.tsx   # form update progres
├── pengerjaan/[id]/selesai/page.tsx  # form upload bukti & close ticket
└── riwayat/page.tsx

src/app/(admin)/
├── dashboard/page.tsx
├── pengguna/page.tsx  pengguna/tambah/page.tsx  pengguna/[id]/edit/page.tsx
├── section/page.tsx  section/tambah/page.tsx
├── layanan/page.tsx  layanan/tambah/page.tsx
├── pic/page.tsx  pic/tambah/page.tsx           # mapping PIC ke section
├── permintaan/page.tsx                          # semua tiket (global view)
└── laporan/page.tsx

src/components/pic/   (QueueCard, StatusUpdateForm, ProofUploadForm)
src/components/admin/ (DataTable, CrudModal, RoleSelector)
```

### B.4 Database (tabel yang dipakai modul ini)
| Tabel | Peran dalam Modul |
|---|---|
| `karyawan` | Dikelola penuh oleh Admin (CRUD + role assignment) |
| `bagian` | Master section — CRUD oleh Admin |
| `layanan` | Master katalog layanan — CRUD oleh Admin |
| `permintaan` | Diproses PIC (`id_pic` FK), dipantau Admin |
| `riwayat_permintaan` | Ditulis PIC setiap update status |
| `lampiran` | Bukti fisik penyelesaian dari PIC |
| `plant`, `lantai` | Master lokasi — dikelola Admin |

### B.5 Endpoint API
```
GET    /api/pic/antrean
POST   /api/pic/permintaan/{id}/accept
POST   /api/pic/permintaan/{id}/reject
PATCH  /api/pic/permintaan/{id}/status        # In Progress / Pending
POST   /api/pic/permintaan/{id}/selesaikan    # upload bukti + Completed
GET    /api/pic/riwayat

GET    /api/admin/users        POST /api/admin/users        PATCH /api/admin/users/{id}
GET    /api/admin/sections     POST /api/admin/sections     PATCH /api/admin/sections/{id}
GET    /api/admin/layanan      POST /api/admin/layanan      PATCH /api/admin/layanan/{id}
GET    /api/admin/pic-mapping  POST /api/admin/pic-mapping
GET    /api/admin/permintaan                  # semua tiket, semua section
GET    /api/admin/laporan?periode=&section=
GET    /api/admin/laporan/export?format=pdf|excel
```

### B.6 Sprint Plan — Modul Administrator & PIC
| Sprint | Durasi | Fokus | Deliverable |
|---|---|---|---|
| **Sprint 1** | 3 minggu | Setup repo, skema DB (entitas master & transaksi), mockup Figma (Admin+PIC), auth + RBAC | Skema DB siap, mockup high-fidelity, login berfungsi |
| **Sprint 2** | 3 minggu | Modul Admin: CRUD penuh user, section, katalog layanan, mapping PIC↔section | Admin dapat mengelola seluruh master data |
| **Sprint 3** | 3 minggu | Modul PIC: antrean tiket per section, accept/reject, update status (In Progress/Pending), form upload bukti & Completed | PIC dapat memproses tiket end-to-end |
| **Sprint 4** | 3 minggu | Rekap laporan Admin (filter + export), integrasi API dengan modul Karyawan/Supervisor milik Syifa, System Integration Testing & Black-box Testing | Laporan admin lengkap; sistem terintegrasi penuh |

---

## 3. Titik Integrasi Antar-PRD (Sprint 4 — Bersama)

| Titik Integrasi | Modul A (Syifa) | Modul B (Faiz) |
|---|---|---|
| Tiket dibuat Karyawan → masuk antrean PIC | `POST /employee/permintaan` menulis `permintaan` | `GET /pic/antrean` membaca `permintaan` (filter `id_pic`) |
| Update status oleh PIC → terlihat di self-tracking & monitoring | Baca `riwayat_permintaan` | Tulis `riwayat_permintaan` |
| Master data (section/layanan) dari Admin → dipakai form pengajuan Karyawan | Dropdown section/layanan (read) | CRUD section/layanan (write) |
| Role & hak akses akun | Middleware RBAC (shared) | Sumber data role dari `admin/users` |

## 4. Standar Non-Fungsional Bersama
- **Auth:** Bcrypt hashing, token-based (Sanctum/JWT), Role-Based Access Control
- **File Upload:** JPG, PNG, PDF — maksimal 5 MB
- **Testing:** Black-box Testing per modul + System Integration Testing di Sprint 4
- **Deployment:** Standalone/intranet, tidak terhubung ke server produksi korporat (MySBI)