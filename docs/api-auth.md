# API Akun (Auth)

Kontrak endpoint akun untuk frontend dan Faiz. Mengikuti PRD 6.1.
Autentikasi: **Sanctum SPA (cookie sesi)**, keputusan D5. Tidak ada token di browser.

## Aturan dasar frontend

| Hal | Aturan |
|---|---|
| Alamat dibuka | `http://localhost:3000` (**bukan** `127.0.0.1`, cookie sesi tidak terbaca) |
| axios | `withCredentials: true` dan `withXSRFToken: true` |
| Sebelum login/register | panggil `GET /sanctum/csrf-cookie` (204, mengirim cookie `XSRF-TOKEN`) |
| Header | `Accept: application/json` (agar error berbentuk JSON) |
| Permintaan dari luar frontend (curl/Postman) | tanpa header `Origin: http://localhost:3000` sesi tidak aktif; login ditolak 400 |

## Ringkasan

| Method | Path | Akses | Fungsi |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | publik | Ambil cookie CSRF |
| GET | `/api/referensi/sections` | publik | Daftar section aktif (dropdown register) |
| POST | `/api/auth/register` | publik, 6/menit/IP | Daftar akun karyawan |
| POST | `/api/auth/login` | publik, **5 percobaan/menit** | Masuk |
| POST | `/api/auth/logout` | login | Keluar |
| GET | `/api/auth/me` | login | Data akun sendiri |
| PATCH | `/api/auth/me` | login | Ubah nama, email, telepon |
| PATCH | `/api/auth/password` | login | Ganti kata sandi |

"login" berarti memakai `auth:sanctum` dan `akun.aktif`. Akun nonaktif mendapat 403.

## Bentuk data user

Dipakai oleh register, login, `me`, dan ubah profil (dibungkus di `data`):

```json
{
  "data": {
    "id": 12,
    "name": "Syifa Fitria Azizah",
    "nik": "EMP-2023-0842",
    "email": "syifa@sbi.co.id",
    "role": "employee",
    "role_label": "Karyawan",
    "home": "/employee/dashboard",
    "status": "aktif",
    "jabatan": null,
    "telepon": "+62 812 0000 1111",
    "bagian": { "id": 3, "kode_bagian": "IS", "nama_bagian": "Information System" },
    "created_at": "2026-11-22T11:20:00+00:00"
  }
}
```

- `home`: halaman awal peran (`/employee/dashboard`, `/supervisor/dashboard`, `/pic/dashboard`, `/admin/dashboard`). Frontend memakainya untuk mengarahkan setelah login.
- `bagian` bernilai `null` untuk Admin.

## POST /api/auth/register

Body: `name`, `nik`, `email`, `section` (kode: `ASM`, `HR`, `IS`, `PE`, `GA`; `Assembly` dipetakan ke `ASM`) atau `id_bagian`, `password`, `password_confirmation`.
Alias dari form frontend: `fullName` dan `confirmPassword` juga diterima.

- **201**: user baru (role selalu `employee`, status `aktif`, PRD D9) dan `message`.
- **422**: `errors` per field (NIK/email ganda, sandi lemah, section tidak aktif, dan sebagainya).

## POST /api/auth/login

Body:

```json
{ "login": "syifa@sbi.co.id", "password": "Enterprise@2026", "remember": false }
```

- `login`: **NIK atau email** (jika ada `@` dianggap email; tidak peka huruf besar/kecil).
- `remember` (opsional): kotak "Ingat sesi saya".

| Status | Arti |
|---|---|
| **200** | `{ "data": { ...user }, "message": "Berhasil masuk." }`, sesi dibuat |
| **422** | `errors.login[0]` = "NIK/Email atau kata sandi tidak valid." (pesan sama untuk akun tidak ada maupun sandi salah) |
| **403** | `message` = "Akun Anda dinonaktifkan. Hubungi Administrator." (hanya bila sandi benar) |
| **429** | `message` = "Terlalu banyak percobaan masuk. Coba lagi dalam N detik." + header `Retry-After` |
| **400** | Permintaan tidak dari frontend stateful (tanpa sesi) |

Pembatas: 5 percobaan gagal per menit untuk kombinasi akun + IP. Login berhasil mereset hitungan.

## POST /api/auth/logout

**200** `{ "message": "Anda telah keluar." }`. Sesi dan token CSRF diganti. **401** bila belum login.

## GET /api/auth/me

**200** `{ "data": { ...user } }`. **401** bila belum login, **403** bila akun nonaktif.
Cocok dipakai frontend untuk memeriksa sesi dan peran saat halaman dimuat.

## PATCH /api/auth/me

Body (semua opsional, boleh sebagian): `name`, `email`, `telepon`.

- **200**: `{ "data": { ...user }, "message": "Profil berhasil diperbarui." }`
- **422**: email dipakai akun lain, format email/telepon salah, atau domain email tidak diizinkan.
- `nik`, `role`, `status`, dan `id_bagian` **diabaikan** walau dikirim (hanya Admin yang bisa mengubahnya).
- Telepon kosong (`""`) menghapus nomor.

## PATCH /api/auth/password

Body: `current_password`, `password`, `password_confirmation`.

- **200** `{ "message": "Kata sandi berhasil diubah." }`
- **422**: sandi lama salah, konfirmasi tidak cocok, sandi baru sama dengan lama, atau tidak memenuhi kebijakan.
- Kebijakan sandi = kebijakan registrasi (`config/register.php`). Token "ingat saya" diputar sehingga perangkat lain keluar.

## Format error

Semua error validasi mengikuti bentuk standar Laravel:

```json
{ "message": "NIK/Email atau kata sandi tidak valid.", "errors": { "login": ["NIK/Email atau kata sandi tidak valid."] } }
```

| Status | Makna umum |
|---|---|
| 401 | Belum login. Frontend arahkan ke `/login` |
| 403 | Akun nonaktif atau peran tidak sesuai |
| 419 | Token CSRF kedaluwarsa. Panggil `/sanctum/csrf-cookie` lalu ulangi sekali |
| 422 | Validasi gagal, tampilkan `errors` per field |
| 429 | Terlalu banyak percobaan, hormati `Retry-After` |

## Cek peran sesi

Tiap modul punya `GET /api/{employee|supervisor|pic|admin}/ping` yang mengembalikan `{ "peran": "..." }`.
Berguna untuk pengaman halaman per peran. 403 bila peran tidak cocok.

## Akun contoh (seeder, hanya lokal)

Setelah `php artisan db:seed`, kata sandi bawaan `password` (`SEED_DEFAULT_PASSWORD`):

| Peran | Email |
|---|---|
| Admin | `admin@sbi.test` |
| Supervisor | `supervisor.is@sbi.test` (juga `.asm`, `.hr`, `.pe`, `.ga`) |
| PIC | `pic.is1@sbi.test`, `pic.ga1@sbi.test`, dan lainnya |
| Karyawan | `karyawan.is@sbi.test` (juga `.asm`, `.hr`, `.pe`, `.ga`) |
