import { api } from "./client";
import type { Halaman, PermintaanDetail } from "./permintaan";
import type { Prioritas, StatusTiket } from "./types";

// Monitoring tiket section sendiri untuk supervisor, read-only (PRD 6.4). Melempar ApiError saat gagal.

/** Satu baris daftar monitoring. */
export interface TiketMonitoring {
  id: number;
  kode_tiket: string;
  judul: string;
  status: StatusTiket;
  /** Label umum, mis. "Menunggu Pemeriksaan" (bukan "Diajukan" milik karyawan). */
  status_label: string;
  prioritas: Prioritas;
  prioritas_label: string;
  layanan?: { id: number; nama_layanan: string; kategori: string };
  pengaju?: string | null;
  pic?: string | null;
  lokasi: { plant?: string | null; lantai?: string | null };
  dibuat_pada: string | null;
}

/** Detail tiket untuk supervisor: bentuk sama dengan detail karyawan, tanpa tombol tinjau, dengan data pengaju. */
export type DetailMonitoring = Omit<PermintaanDetail, "bisa_ditinjau"> & {
  pengaju?: { id: number; name: string; jabatan: string | null } | null;
};

export interface FilterMonitoring {
  status?: StatusTiket | "";
  layanan?: number | "";
  /** YYYY-MM-DD, tanggal pengajuan. */
  dari?: string;
  /** YYYY-MM-DD, hari ini ikut seluruhnya. */
  sampai?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

/** GET /api/supervisor/permintaan: tiket section sendiri, terbaru lebih dulu. */
export async function getMonitoring(filter: FilterMonitoring = {}): Promise<Halaman<TiketMonitoring>> {
  const params: Record<string, string | number> = {};
  if (filter.status) params.status = filter.status;
  if (filter.layanan) params.layanan = filter.layanan;
  if (filter.dari) params.dari = filter.dari;
  if (filter.sampai) params.sampai = filter.sampai;
  if (filter.q?.trim()) params.q = filter.q.trim();
  if (filter.page && filter.page > 1) params.page = filter.page;
  if (filter.per_page) params.per_page = filter.per_page;

  const { data } = await api.get<Halaman<TiketMonitoring>>("/api/supervisor/permintaan", { params });
  return data;
}

/** GET /api/supervisor/permintaan/{id}: detail read-only. 404 bila bukan tiket section sendiri. */
export async function getDetailMonitoring(id: number | string): Promise<DetailMonitoring> {
  const { data } = await api.get<{ data: DetailMonitoring }>(`/api/supervisor/permintaan/${id}`);
  return data.data;
}
