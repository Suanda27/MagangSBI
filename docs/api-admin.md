# Kontrak API Admin — Master Data dan Pengaturan

Semua endpoint di bawah `/api/admin/...` hanya untuk peran **admin** (sesi cookie Sanctum, sama seperti
`docs/api-auth.md`). Peran lain mendapat **403**, tamu mendapat **401**. Data **dinonaktifkan lewat `status`,
tidak pernah dihapus** — tidak ada endpoint `DELETE` untuk data (menjawab 405). Satu-satunya `DELETE` adalah
`/pic-mapping/{user}`, yang hanya mengembalikan peran PIC menjadi karyawan.

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

## 4. Lokasi: plant dan lantai

Plant dan lantai ikut aturan master data: **dinonaktifkan, tidak dihapus** (kolom `status`, ditambahkan lewat migrasi
`add_status_to_plants_and_lantais_tables`; jalankan `php artisan migrate`). Lokasi nonaktif tidak muncul di
`GET /api/referensi/lokasi` (form pengajuan), tetapi tiket lama tetap menyimpannya.

### `GET /api/admin/plants`

Semua plant beserta **semua lantainya** (semua status), urut nama, tanpa paginasi. Query opsional: `q`, `status`.

```json
{ "data": [{
  "id": 1, "nama_plant": "Plant 1", "status": "aktif", "status_label": "Aktif", "jumlah_lantai": 3,
  "lantais": [{ "id": 1, "nama_lantai": "Lantai 1", "id_plant": 1, "status": "aktif", "status_label": "Aktif" }],
  "created_at": "2026-11-23T08:00:00+07:00"
}] }
```

### `POST /api/admin/plants` — 201 · `PATCH /api/admin/plants/{id}`

| Field | Aturan |
|---|---|
| `nama_plant` | wajib (POST), unik |
| `status` | opsional, bawaan `aktif` |

### `GET /api/admin/lantais`

Daftar datar, urut plant lalu nama. Query opsional: `id_plant`, `status`. Setiap item memuat `plant: { id, nama_plant }`.

### `POST /api/admin/lantais` — 201 · `PATCH /api/admin/lantais/{id}`

| Field | Aturan |
|---|---|
| `id_plant` | wajib (POST), plant harus aktif. **Dilarang pada PATCH** (422): lantai tidak dapat dipindah antar plant karena tiket lama menyimpan pasangan plant dan lantainya |
| `nama_lantai` | wajib (POST), unik di dalam satu plant |
| `status` | opsional, bawaan `aktif` |

---

## 5. Pemetaan PIC

Satu PIC = satu section; satu section boleh punya banyak PIC (antrean dibagi bersama). Menetapkan PIC mengubah
`role` menjadi `pic`. (`PATCH /api/admin/users/{id}` dengan `role` + `id_bagian` juga bisa, tetapi endpoint ini
khusus untuk halaman pemetaan.)

### `GET /api/admin/pic-mapping`

Daftar PIC beserta section dan beban tiketnya, berpaginasi. Query: `q`, `id_bagian`, `status`, `per_page`, `page`.

```json
{ "data": [{
  "id": 7, "name": "Budi Santoso", "nik": "22010001", "email": "budi@sbi.co.id", "jabatan": "...", "telepon": "...",
  "role": "pic", "status": "aktif", "status_label": "Aktif",
  "bagian": { "id": 3, "kode_bagian": "IS", "nama_bagian": "Information System" },
  "tiket_aktif": 2
}], "links": {...}, "meta": {...} }
```

`tiket_aktif` = tiket berjalan yang sedang dipegang PIC itu (tiket selesai/ditolak tidak dihitung).

### `POST /api/admin/pic-mapping` — 201

| Field | Aturan |
|---|---|
| `user_id` | wajib; harus **karyawan aktif**. Sudah PIC, supervisor, atau admin → 422 |
| `id_bagian` | wajib, section harus aktif |

### `PATCH /api/admin/pic-mapping/{user}`

Body: `id_bagian` (wajib, section aktif). Memindahkan PIC ke section lain. Bukan PIC → **404**.
PIC yang masih memegang tiket berjalan → **409**.

### `DELETE /api/admin/pic-mapping/{user}`

Mengembalikan PIC menjadi **karyawan** (section tetap). **Akun tidak dihapus.** Bukan PIC → 404.
PIC yang masih memegang tiket berjalan → **409**.

---

## 6. Pengaturan sistem

Hanya batas ukuran dan format lampiran yang dapat diubah (PRD D11). Nilai disimpan di tabel `pengaturans`
dan dibaca juga oleh `GET /api/referensi/aturan-lampiran` dan layanan unggah berkas, sehingga form dan server
selalu memakai aturan yang sama.

### `GET /api/admin/pengaturan`

```json
{ "data": { "max_upload_mb": 5, "format_lampiran": ["jpg", "png", "pdf"], "digit_nomor_tiket": 4, "maks_berkas": 5 } }
```

`digit_nomor_tiket` dan `maks_berkas` hanya dibaca.

### `PATCH /api/admin/pengaturan`

Kirim hanya kunci yang diubah.

| Field | Aturan |
|---|---|
| `max_upload_mb` | bilangan bulat 1–5 (batas sistem 5 MB) |
| `format_lampiran` | larik, minimal satu, isi dari `jpg`, `png`, `pdf`, tanpa duplikat (huruf besar/kecil diabaikan) |
| `digit_nomor_tiket` | **dilarang** (422): format nomor tiket tetap |

Respons: `{ "message": "Pengaturan berhasil disimpan.", "data": { ... } }`

---

## Catatan untuk penyambungan frontend

- Kirim `X-XSRF-TOKEN` seperti endpoint lain (axios `withCredentials` + `withXSRFToken`).
- Halaman Admin → Pengguna memakai `GET /users` berpaginasi; Section dan Layanan memakai filter `status`
  untuk tab Aktif/Nonaktif.
- Form Tambah/Ubah Pengguna: tampilkan field section hanya untuk peran selain admin, dan baca pesan 409
  apa adanya (sudah berbahasa Indonesia dan menyebut jumlah tiket).
