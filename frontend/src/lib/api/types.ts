// Bentuk data API. Kontrak lengkap: docs/api-auth.md

export type Role = "employee" | "supervisor" | "pic" | "admin";

export interface Bagian {
  id: number;
  kode_bagian: string;
  nama_bagian: string;
}

export interface User {
  id: number;
  name: string;
  nik: string | null;
  email: string;
  role: Role;
  role_label: string;
  /** Halaman awal peran ini, mis. "/employee/dashboard". */
  home: string;
  status: "aktif" | "nonaktif";
  jabatan: string | null;
  telepon: string | null;
  /** Null untuk Admin; tidak ada bila relasi tidak dimuat. */
  bagian?: Bagian | null;
  created_at: string;
}

export interface Section {
  id: number;
  kode_bagian: string;
  nama_bagian: string;
  deskripsi: string | null;
}

export interface LoginPayload {
  /** NIK atau email. */
  login: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  name: string;
  nik: string;
  email: string;
  /** Kode section (ASM, HR, IS, PE, GA), atau kirim id_bagian. */
  section?: string;
  id_bagian?: number;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  telepon?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// ---- Pengajuan layanan (docs: PRD 6.2 dan 6.3) ----

export type Prioritas = "normal" | "tinggi" | "mendesak";

export interface Layanan {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
  kategori: string;
  deskripsi: string | null;
}

/** GET /api/referensi/layanan: dikelompokkan per kategori. */
export interface KategoriLayanan {
  kategori: string;
  layanan: Layanan[];
}

export interface Lantai {
  id: number;
  nama_lantai: string;
  id_plant: number;
}

export interface Plant {
  id: number;
  nama_plant: string;
  lantais: Lantai[];
}

/** GET /api/referensi/aturan-lampiran: mengikuti pengaturan Admin. */
export interface AturanLampiran {
  maks_berkas: number;
  maks_ukuran_mb: number;
  /** Ekstensi huruf kecil, mis. ["jpg", "png", "pdf"]. */
  format: string[];
}

export interface BuatPermintaanPayload {
  id_layanan: number;
  id_plant: number;
  id_lantai: number;
  lokasi_detail?: string;
  judul: string;
  deskripsi: string;
  prioritas: Prioritas;
  lampiran: File[];
}

/** Tiket yang dikembalikan POST /api/employee/permintaan. */
export interface PermintaanBaru {
  id: number;
  kode_tiket: string;
  judul: string;
  status: string;
  status_label: string;
  prioritas: Prioritas;
}

// ---- Dashboard karyawan (GET /api/employee/dashboard) ----

export type StatusTiket = "submitted" | "in_progress" | "pending" | "waiting_review" | "completed" | "rejected";

/** Tiket ringkas pada daftar "terbaru" dashboard karyawan. */
export interface TiketRingkas {
  id: number;
  kode_tiket: string;
  judul: string;
  status: StatusTiket;
  status_label: string;
  prioritas: Prioritas;
  prioritas_label: string;
  layanan?: { id: number; nama_layanan: string; kategori: string };
  bagian?: { id: number; kode_bagian: string; nama_bagian: string };
  dibuat_pada: string | null;
}

export interface DashboardKaryawan {
  total: number;
  /** Tiket yang belum final (diajukan, diproses, pending, menunggu konfirmasi). */
  berjalan: number;
  per_status: Record<StatusTiket, number>;
  terbaru: TiketRingkas[];
}

// ---- Dashboard supervisor (GET /api/supervisor/dashboard) ----

export type AksiRiwayat =
  | "submitted"
  | "accepted"
  | "rejected"
  | "paused"
  | "resumed"
  | "result_sent"
  | "revision_requested"
  | "approved"
  | "auto_closed";

export interface TiketSupervisor {
  id: number;
  kode_tiket: string;
  judul: string;
  status: StatusTiket;
  status_label: string;
  prioritas: Prioritas;
  prioritas_label: string;
  layanan: string | null;
  pengaju: string | null;
  pic: string | null;
  dibuat_pada: string | null;
}

export interface AktivitasSupervisor {
  id: number;
  aksi: AksiRiwayat;
  judul: string;
  status: StatusTiket;
  kode_tiket: string | null;
  judul_tiket: string | null;
  /** Nama pelaku, atau "Sistem". */
  pelaku: string;
  waktu: string | null;
}

export interface DashboardSupervisor {
  bagian: Bagian | null;
  total: number;
  berjalan: number;
  baru_hari_ini: number;
  per_status: Record<StatusTiket, number>;
  /** Persen tiket Selesai; null bila belum ada tiket. */
  rasio_selesai: number | null;
  /** Rata-rata jam dari dibuat sampai selesai; null bila belum ada tiket Selesai. */
  rata_durasi_jam: number | null;
  rata_revisi: number | null;
  terbaru: TiketSupervisor[];
  aktivitas: AktivitasSupervisor[];
}
