# Kontrak API Admin — Pengguna, Section, Layanan

Semua endpoint di bawah `/api/admin/...` hanya untuk peran **admin** (sesi cookie Sanctum, sama seperti
`docs/api-auth.md`). Peran lain mendapat **403**, tamu mendapat **401**. Data **dinonaktifkan lewat `status`,
tidak pernah dihapus** — tidak ada endpoint `DELETE` (menjawab 405).

Kode status yang dipakai:

| Kode | Arti |
|---|---|
| 200 / 201 | Berhasil / dibuat |
| 401 / 403 | Belum login / bukan admin atau akun nonaktif |
| 404 | Data tidak ditemukan |
| 409 | Perubahan ditolak karena masih ada tiket berjalan yang bergantung padanya |
| 422 | Isian tidak valid (`errors` per field), termasuk mengunci akun sendiri |

Format galat 422: `{ "message": "...", "errors": { "field": ["pesan"] } }`. Galat 409: `{ "message": "..." }`.

---

## 1. Pengguna

### `GET /api/admin/users`

Daftar bertahap, urut nama.

| Query | Isi |
|---|---|
| `q` | Cari pada nama, NIK, atau email |
| `role` | `employee` \| `supervisor` \| `pic` \| `admin` |
| `status` | `aktif` \| `nonaktif` |
| `id_bagian` | Id section |
| `per_page` | 1–100, bawaan 15 |
| `page` | Nomor halaman |

Respons: `{ "data": [User], "links": {...}, "meta": { "current_page", "per_page", "total", "last_page", ... } }`

`User`:

```json
{
  "id": 7, "name": "Rina Wulandari", "nik": "22010999", "email": "rina@sbi.co.id",
  "role": "pic", "role_label": "PIC", "home": "/pic/dashboard", "status": "aktif",
  "jabatan": "Staff", "telepon": "+62 812 0000 9999",
  "bagian": { "id": 3, "kode_bagian": "IS", "nama_bagian": "Information System" },
  "created_at": "2026-11-23T08:00:00+07:00"
}
```

`bagian` bernilai `null` untuk admin.

### `GET /api/admin/users/{id}`

Respons: `{ "data": User }`

### `POST /api/admin/users` — 201

| Field | Aturan |
|---|---|
| `name` | wajib, maks 255 |
| `nik` | wajib, unik, mengikuti `config/register.php` (`nik_pattern`) |
| `email` | wajib, unik, domain mengikuti `allowed_email_domains` |
| `password`, `password_confirmation` | wajib, sama dengan kebijakan kata sandi registrasi |
| `role` | wajib: `employee`, `supervisor`, `pic`, atau `admin` |
| `id_bagian` | **wajib** untuk `employee`/`supervisor`/`pic` (section harus aktif); **dilarang** untuk `admin` |
| `jabatan`, `telepon` | opsional |
| `status` | opsional, bawaan `aktif` |

Respons: `{ "message": "Pengguna berhasil dibuat.", "data": User }`

### `PATCH /api/admin/users/{id}`

Semua field di atas opsional; yang tidak dikirim tidak berubah. `password` + `password_confirmation` dikirim
hanya untuk **mereset** kata sandi.

Aturan tambahan:

- Setelah perubahan, peran selain admin harus punya `id_bagian`. Bila peran menjadi `admin`, section otomatis dikosongkan.
- **Admin tidak dapat** mengubah peran atau menonaktifkan akunnya sendiri → **422** (`role` / `status`).
- **PIC yang masih memegang tiket berjalan** (`submitted`/`in_progress`/`pending`/`waiting_review` dengan `id_pic` = PIC itu)
  tidak dapat dinonaktifkan, dipindah section, atau diubah perannya → **409**. Mengubah nama/telepon tetap boleh.
- Akun nonaktif langsung ditolak di semua endpoint (403) pada permintaan berikutnya.

Respons: `{ "message": "Pengguna berhasil diperbarui.", "data": User }`

> Pemetaan PIC ke section dilakukan lewat endpoint ini (`role: "pic"` + `id_bagian`). Satu section boleh punya banyak PIC;
> satu PIC hanya satu section.

---

## 2. Section

### `GET /api/admin/sections`

Semua section (tanpa paginasi), urut kode. Query opsional: `q` (kode/nama), `status`.

```json
{ "data": [{
  "id": 3, "kode_bagian": "IS", "nama_bagian": "Information System", "deskripsi": "...",
  "status": "aktif", "status_label": "Aktif",
  "jumlah_pic": 2, "jumlah_pengguna": 4, "jumlah_layanan": 6,
  "created_at": "2026-11-23T08:00:00+07:00"
}] }
```

`jumlah_pic` hanya menghitung PIC yang **aktif**.

### `POST /api/admin/sections` — 201

| Field | Aturan |
|---|---|
| `kode_bagian` | wajib, 2–10 huruf (otomatis huruf besar), unik. Dipakai pada nomor tiket, mis. `GA-2026-0001` |
| `nama_bagian` | wajib, unik |
| `deskripsi` | opsional |
| `status` | opsional, bawaan `aktif` |

### `PATCH /api/admin/sections/{id}`

| Field | Aturan |
|---|---|
| `nama_bagian`, `deskripsi`, `status` | opsional |
| `kode_bagian` | **dilarang** (422): kode sudah tertulis pada nomor tiket yang terbit |

Menonaktifkan section yang masih punya tiket berjalan → **409**.

---

## 3. Layanan

Berbeda dari `GET /api/referensi/layanan` (hanya layanan aktif, untuk form pengajuan), endpoint ini
menampilkan **semua status**.

### `GET /api/admin/layanan`

Daftar bertahap, urut section → kategori → nama. Query: `q` (kode/nama), `id_bagian`, `kategori`, `status`, `per_page`, `page`.

```json
{ "data": [{
  "id": 12, "kode_layanan": "SRV-101", "nama_layanan": "Perbaikan Printer", "kategori": "Dukungan IT",
  "deskripsi": "...", "status": "aktif", "status_label": "Aktif",
  "bagian": { "id": 3, "kode_bagian": "IS", "nama_bagian": "Information System" },
  "created_at": "2026-11-23T08:00:00+07:00"
}], "links": {...}, "meta": {...} }
```

### `POST /api/admin/layanan` — 201

| Field | Aturan |
|---|---|
| `kode_layanan` | wajib, unik, maks 20, huruf besar/angka/tanda hubung (otomatis huruf besar) |
| `nama_layanan` | wajib, unik **di dalam section yang sama** |
| `kategori` | wajib |
| `deskripsi` | opsional |
| `id_bagian` | wajib, section harus aktif (menentukan section tujuan tiket) |
| `status` | opsional, bawaan `aktif` |

### `PATCH /api/admin/layanan/{id}`

Semua field opsional. Layanan boleh dipindah ke section aktif lain; tiket yang sudah terbit menyimpan section
tujuannya sendiri, jadi hanya tiket berikutnya yang terpengaruh. Menonaktifkan layanan menyembunyikannya dari
form pengajuan; tiket yang sedang berjalan tidak terpengaruh.

---

## Catatan untuk penyambungan frontend

- Kirim `X-XSRF-TOKEN` seperti endpoint lain (axios `withCredentials` + `withXSRFToken`).
- Halaman Admin → Pengguna memakai `GET /users` berpaginasi; Section dan Layanan memakai filter `status`
  untuk tab Aktif/Nonaktif.
- Form Tambah/Ubah Pengguna: tampilkan field section hanya untuk peran selain admin, dan baca pesan 409
  apa adanya (sudah berbahasa Indonesia dan menyebut jumlah tiket).
