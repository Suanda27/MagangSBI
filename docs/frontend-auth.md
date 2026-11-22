# Autentikasi di Frontend

Panduan memakai klien API, `useAuth`, dan `RoleGuard`. Kontrak endpoint ada di [`api-auth.md`](api-auth.md).
Autentikasi memakai **Sanctum SPA (cookie sesi)**, bukan token di browser.

## Persiapan

1. Jalankan backend (`php artisan serve`, port 8000) dan frontend (`npm run dev`, port 3000).
2. Buka aplikasi lewat **`http://localhost:3000`**, bukan `127.0.0.1` (cookie sesi tidak terbaca).
3. Alamat backend dari `NEXT_PUBLIC_BACKEND_URL` (bawaan `http://localhost:8000`). Salin `.env.example`
   menjadi `.env.local` bila perlu mengubahnya. Variabel `NEXT_PUBLIC_*` dimasukkan ke bundel saat build,
   jadi restart `npm run dev` setelah mengubahnya.

## Struktur

| File | Fungsi |
|---|---|
| `src/lib/axios.ts` | Instance axios (`withCredentials`, `withXSRFToken`, `Accept: application/json`) |
| `src/lib/api/client.ts` | Penghubung: CSRF otomatis, ulang sekali saat 419, penanganan 401, error seragam |
| `src/lib/api/auth.ts` | Fungsi bertipe: `login`, `logout`, `register`, `me`, `updateProfile`, `changePassword`, `getSections` |
| `src/lib/api/errors.ts` | `ApiError`, `fieldErrors()`, `errorMessage()` |
| `src/lib/api/types.ts` | Tipe `User`, `Role`, `Section`, dan payload |
| `src/lib/auth/auth-context.tsx` | `AuthProvider` dan `useAuth()` |
| `src/components/shared/auth/role-guard.tsx` | `RoleGuard` (pengaman halaman per peran) |

## Memanggil API

Selalu lewat fungsi di `lib/api/auth.ts` (atau instance `api` dari `lib/api/client.ts` untuk endpoint baru),
**jangan** memakai `lib/axios.ts` langsung: hanya `client.ts` yang memasang penanganan CSRF dan error.

```ts
import { api } from "@/lib/api/client";
import type { Section } from "@/lib/api/types";

const { data } = await api.get<{ data: Section[] }>("/api/referensi/sections");
```

Yang terjadi otomatis:

| Situasi | Perilaku |
|---|---|
| POST/PATCH/DELETE tanpa cookie `XSRF-TOKEN` | Memanggil `GET /sanctum/csrf-cookie` dulu |
| Respons **419** (CSRF kedaluwarsa) | Mengambil token baru lalu mengulang **sekali** |
| Respons **401** (sesi habis) | `useAuth` dikosongkan dan pengguna diarahkan ke `/login` (kecuali halaman publik) |
| Gagal jaringan / server mati | `ApiError` dengan `status === 0` dan pesan ramah |

Untuk pemeriksaan yang boleh 401 tanpa mengalihkan halaman, kirim `{ skipAuthRedirect: true }` di konfigurasi
(dipakai `login`, `logout`, dan `me`).

## Menangani error

Semua kegagalan menjadi `ApiError`:

```ts
import { ApiError, fieldErrors, errorMessage } from "@/lib/api/errors";

try {
  await register(payload);
} catch (err) {
  const kolom = fieldErrors(err);   // { email: "Email ini sudah digunakan.", ... } untuk bawah input
  const umum = errorMessage(err);   // pesan satu baris
  if (err instanceof ApiError && err.status === 429) { /* err.retryAfter bila tersedia */ }
}
```

Nama field dari backend adalah `name`, `nik`, `email`, `section`, `password`. Bila nama state di form berbeda
(mis. `fullName`), petakan sendiri saat membaca `fieldErrors()`.

## `useAuth()`

```tsx
const { user, status, login, logout, refresh, setUser } = useAuth();
```

- `status`: `"loading"` (sesi sedang diperiksa), `"authenticated"`, atau `"guest"`.
- `user`: `User` (termasuk `role` dan `home`) atau `null`.
- `login()` menyimpan akun dan mengembalikannya. Arahkan ke `user.home` setelahnya.
- `logout()` mengakhiri sesi lalu menuju `/login`.
- `setUser()` dipakai setelah ubah profil agar tampilan langsung mengikuti.

`AuthProvider` sudah terpasang di `src/app/layout.tsx`; tidak perlu dipasang lagi.

## `RoleGuard`

Pasang di layout peran:

```tsx
import RoleGuard from "@/components/shared/auth/role-guard";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["employee"]}>{/* ...layout... */ children}</RoleGuard>;
}
```

- Tamu diarahkan ke `/login`; peran tidak cocok diarahkan ke dashboard perannya sendiri.
- Selama sesi diperiksa tampil indikator "Memeriksa sesi...".

> **RoleGuard hanya untuk pengalaman pengguna, bukan keamanan.** Data tetap dilindungi backend
> (`auth:sanctum`, `akun.aktif`, `role:<peran>`). Panduan Next.js juga menyebutkan bahwa pengecekan di layout
> tidak berjalan ulang saat pindah halaman, jadi jangan menaruh data sensitif di sisi klien hanya karena
> guard menyembunyikannya.

Layout PIC dan Admin (milik Faiz) belum memakai `RoleGuard`; cukup membungkus `children` seperti contoh di atas.

## Catatan pengembangan

- Halaman login menampilkan **"Isi otomatis"** dan **pintasan dashboard prototipe** hanya saat
  `NODE_ENV === "development"`; keduanya tidak muncul di build produksi.
- Header `Retry-After` pada respons 429 belum bisa dibaca browser karena `exposed_headers` di
  `backend/config/cors.php` kosong. Pesan dari server sudah memuat jumlah detik, jadi tampilan tetap benar.
