import { api } from "./client";
import type { AksiRiwayat } from "./types";

// Notifikasi dalam aplikasi (PRD 4.3 dan 6.1), tanpa email. Semua melempar ApiError saat gagal.

export interface Notifikasi {
  /** UUID. */
  id: string;
  aksi: AksiRiwayat | null;
  /** Judul kejadian, mis. "Permintaan Diterima". */
  judul: string;
  pesan: string;
  id_permintaan: number | null;
  kode_tiket: string | null;
  dibaca: boolean;
  dibaca_pada: string | null;
  dibuat_pada: string | null;
}

export interface DaftarNotifikasi {
  data: Notifikasi[];
  /** Jumlah SELURUH notifikasi yang belum dibaca (tidak terpengaruh filter atau halaman). */
  belum_dibaca: number;
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface FilterNotifikasi {
  belum_dibaca?: boolean;
  page?: number;
  per_page?: number;
}

/** GET /api/notifikasi: milik sendiri, terbaru lebih dulu. */
export async function getNotifikasi(filter: FilterNotifikasi = {}): Promise<DaftarNotifikasi> {
  const params: Record<string, string | number> = {};
  if (filter.belum_dibaca) params.belum_dibaca = 1;
  if (filter.page && filter.page > 1) params.page = filter.page;
  if (filter.per_page) params.per_page = filter.per_page;

  const { data } = await api.get<DaftarNotifikasi>("/api/notifikasi", { params });
  return data;
}

interface HasilBaca {
  diubah: number;
  belum_dibaca: number;
}

/** POST /api/notifikasi/baca dengan daftar id. */
export async function tandaiDibaca(ids: string[]): Promise<HasilBaca> {
  const { data } = await api.post<{ data: HasilBaca }>("/api/notifikasi/baca", { ids });
  return data.data;
}

/** POST /api/notifikasi/baca dengan semua=true. */
export async function tandaiSemuaDibaca(): Promise<HasilBaca> {
  const { data } = await api.post<{ data: HasilBaca }>("/api/notifikasi/baca", { semua: true });
  return data.data;
}
