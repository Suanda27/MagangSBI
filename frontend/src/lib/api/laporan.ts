import { api } from "./client";
import type { TiketMonitoring } from "./monitoring";
import type { Halaman } from "./permintaan";
import type { StatusTiket } from "./types";

// Laporan section sendiri untuk supervisor (PRD 6.4 dan Bagian 7), tanpa SLA. Melempar ApiError saat gagal.

export interface TitikTren {
  /** Kunci periode: "2026-11-10" (hari atau awal minggu) atau "2026-11" (bulan). */
  kunci: string;
  label: string;
  diajukan: number;
  selesai: number;
}

export interface RingkasanLaporan {
  total: number;
  per_status: Record<StatusTiket, number>;
  per_layanan: { id: number; nama_layanan: string; kategori: string; jumlah: number }[];
  per_kategori: { kategori: string; jumlah: number }[];
  selesai: {
    jumlah: number;
    /** Rata-rata jam diajukan sampai selesai; null bila belum ada tiket selesai. */
    rata_rata_jam: number | null;
    tanpa_revisi_persen: number | null;
  };
  /** Rata-rata revisi per tiket; null bila tidak ada tiket. */
  rata_revisi: number | null;
  /** Jumlah tiket (bukan kejadian) yang pernah ditutup otomatis. */
  ditutup_otomatis: number;
  granularitas: "hari" | "minggu" | "bulan";
  tren: TitikTren[];
}

export interface LaporanSupervisor extends Halaman<TiketMonitoring> {
  /** Dihitung untuk SELURUH hasil filter, bukan hanya halaman ini. */
  ringkasan: RingkasanLaporan;
}

export interface FilterLaporan {
  status?: StatusTiket | "";
  layanan?: number | "";
  /** YYYY-MM-DD, tanggal pengajuan. */
  dari?: string;
  /** YYYY-MM-DD, hari ini ikut seluruhnya. */
  sampai?: string;
  page?: number;
  per_page?: number;
}

/** GET /api/supervisor/laporan: rekap tiket section sendiri beserta ringkasan statistik dan tren. */
export async function getLaporanSupervisor(filter: FilterLaporan = {}): Promise<LaporanSupervisor> {
  const params: Record<string, string | number> = {};
  if (filter.status) params.status = filter.status;
  if (filter.layanan) params.layanan = filter.layanan;
  if (filter.dari) params.dari = filter.dari;
  if (filter.sampai) params.sampai = filter.sampai;
  if (filter.page && filter.page > 1) params.page = filter.page;
  if (filter.per_page) params.per_page = filter.per_page;

  const { data } = await api.get<LaporanSupervisor>("/api/supervisor/laporan", { params });
  return data;
}
