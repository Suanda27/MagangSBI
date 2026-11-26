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

export type FormatEkspor = "csv" | "excel" | "pdf";

/** PDF dibuat utuh di memori server; di atas jumlah ini server menolak dan menyarankan CSV atau Excel. */
export const MAKS_BARIS_PDF = 100;

/**
 * GET /api/supervisor/laporan/ekspor: seluruh hasil filter sebagai berkas (bukan hanya halaman yang tampil).
 * Memakai filter yang sama dengan getLaporanSupervisor. Berkas diterima sebagai arraybuffer; bila server menjawab
 * JSON (mis. 422 "terlalu banyak baris untuk PDF"), isinya di-parse supaya pesannya sampai ke pengguna.
 * Hasilnya bisa langsung diberikan ke simpanBlob().
 */
export async function unduhLaporanSupervisor(
  format: FormatEkspor,
  filter: FilterLaporan = {},
): Promise<{ blob: Blob; nama: string }> {
  const params: Record<string, string | number> = { format };
  if (filter.status) params.status = filter.status;
  if (filter.layanan) params.layanan = filter.layanan;
  if (filter.dari) params.dari = filter.dari;
  if (filter.sampai) params.sampai = filter.sampai;

  const res = await api.get<ArrayBuffer>("/api/supervisor/laporan/ekspor", {
    params,
    responseType: "arraybuffer",
    headers: { Accept: "application/json, */*" },
    transformResponse: [
      (data: unknown, headers) => {
        const jenis = String(headers?.["content-type"] ?? "");
        if (jenis.includes("json") && data instanceof ArrayBuffer) {
          try {
            return JSON.parse(new TextDecoder().decode(data));
          } catch {
            return data;
          }
        }
        return data;
      },
    ],
  });

  const ext = format === "excel" ? "xlsx" : format;
  const nama = /filename="?([^";]+)"?/i.exec(String(res.headers["content-disposition"] ?? ""))?.[1] ?? `laporan-tiket.${ext}`;
  return { blob: new Blob([res.data], { type: String(res.headers["content-type"] ?? "application/octet-stream") }), nama };
}
