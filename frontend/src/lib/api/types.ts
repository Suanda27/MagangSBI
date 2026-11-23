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
