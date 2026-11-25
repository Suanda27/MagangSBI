import { api } from "./client";
import type { Halaman } from "./permintaan";
import type { AksiRiwayat, StatusTiket } from "./types";

// Log aktivitas seluruh tiket milik karyawan (PRD 6.3). Melempar ApiError saat gagal.

/** Satu kejadian pada log aktivitas, beserta ringkasan tiketnya. */
export interface KejadianRiwayat {
  id: number;
  aksi: AksiRiwayat;
  /** Judul kejadian, mis. "Permintaan Diterima". */
  judul: string;
  /** Status tiket pada saat kejadian itu. */
  status: StatusTiket;
  status_label: string;
  /** Nama pelaku, atau "Sistem". */
  pelaku: string;
  keterangan: string | null;
  waktu: string | null;
  tiket: { id: number; kode_tiket: string; judul: string; layanan: string | null };
}

export interface FilterRiwayat {
  status?: StatusTiket | "";
  /** Format "YYYY-MM". */
  bulan?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

/** Cocok dengan aturan server: tahun empat digit, bulan 01 sampai 12. */
export const POLA_BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** GET /api/employee/riwayat: log aktivitas, terbaru lebih dulu. */
export async function getRiwayat(filter: FilterRiwayat = {}): Promise<Halaman<KejadianRiwayat>> {
  const params: Record<string, string | number> = {};
  if (filter.status) params.status = filter.status;
  if (filter.bulan && POLA_BULAN.test(filter.bulan)) params.bulan = filter.bulan;
  if (filter.q?.trim()) params.q = filter.q.trim();
  if (filter.page && filter.page > 1) params.page = filter.page;
  if (filter.per_page) params.per_page = filter.per_page;

  const { data } = await api.get<Halaman<KejadianRiwayat>>("/api/employee/riwayat", { params });
  return data;
}
