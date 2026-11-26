import { api } from "./client";
import { unduhBerkas } from "./unduh";

/**
 * Endpoint modul PIC (lihat docs/api-pic.md). Semua melempar ApiError saat gagal:
 * 403 bukan hak PIC ini, 404 tidak ada, 409 keadaan tiket sudah berubah, 422 isian tidak valid.
 */

export type StatusApi = "submitted" | "in_progress" | "pending" | "waiting_review" | "completed" | "rejected";
export type PrioritasApi = "normal" | "tinggi" | "mendesak";
export type TabPic = "masuk" | "diproses" | "selesai";

export interface BerkasApi {
  id: number;
  nama_file: string;
  tipe_file: string;
  ukuran_file: number;
  url: string;
}

export interface PicTiketApi {
  id: number;
  kode_tiket: string;
  judul: string;
  deskripsi: string;
  status: StatusApi;
  status_label: string;
  prioritas: PrioritasApi;
  prioritas_label: string;
  layanan?: { id: number; nama_layanan: string; kategori: string };
  bagian?: { id: number; kode_bagian: string; nama_bagian: string };
  lokasi: { plant?: string; lantai?: string; detail: string | null };
  pengaju?: { id: number; name: string; nik: string | null; jabatan: string | null; bagian?: string | null } | null;
  diterima_pada: string | null;
  selesai_pada: string | null;
  dibuat_pada: string;
  /** Terakhir diubah (updated_at); dipakai untuk "Aktivitas Terbaru". */
  diperbarui_pada?: string;
}

export interface PicDetailApi extends Omit<PicTiketApi, "pengaju"> {
  pengaju?: { id: number; name: string; nik: string | null; jabatan: string | null; telepon: string | null; bagian: string | null } | null;
  pic?: { id: number; name: string } | null;
  lampiran: BerkasApi[];
  hasil_kerja: {
    catatan: string | null;
    dikirim_pada: string | null;
    putaran: { putaran: number; berkas: BerkasApi[] }[];
  };
  alasan_tolak: string | null;
  alasan_pending: string | null;
  alasan_revisi: string | null;
  jumlah_revisi: number;
  ditolak_pada: string | null;
  riwayat: { id: number; aksi: string; judul: string; status: StatusApi; pelaku: string; keterangan: string | null; waktu: string }[];
}

export interface DashboardPicApi {
  antrean: number;
  sedang_diproses: number;
  pending: number;
  menunggu_konfirmasi: number;
  selesai: number;
  ditolak: number;
  antrean_teratas: PicTiketApi[];
}

/** Batas server: per_page maksimal 50. */
export const PER_PAGE_PIC = 50;

export async function getDashboardPic(): Promise<DashboardPicApi> {
  const { data } = await api.get<{ data: DashboardPicApi }>("/api/pic/dashboard");
  return data.data;
}

/** GET /api/pic/permintaan?tab=: satu halaman daftar tiket menurut tab. */
export async function getDaftarPic(tab: TabPic, page = 1): Promise<{ data: PicTiketApi[]; total: number }> {
  const { data } = await api.get<{ data: PicTiketApi[]; meta: { total: number } }>("/api/pic/permintaan", {
    params: { tab, page, per_page: PER_PAGE_PIC },
  });
  return { data: data.data, total: data.meta.total };
}

export async function getDetailPic(id: number | string): Promise<PicDetailApi> {
  const { data } = await api.get<{ data: PicDetailApi }>(`/api/pic/permintaan/${id}`);
  return data.data;
}

export async function terimaTiket(id: number | string, catatan?: string): Promise<PicDetailApi> {
  const { data } = await api.post<{ data: PicDetailApi }>(`/api/pic/permintaan/${id}/terima`, { catatan: catatan?.trim() || undefined });
  return data.data;
}

export async function tolakTiket(id: number | string, alasan: string): Promise<PicDetailApi> {
  const { data } = await api.post<{ data: PicDetailApi }>(`/api/pic/permintaan/${id}/tolak`, { alasan: alasan.trim() });
  return data.data;
}

export async function ubahStatusTiket(id: number | string, status: "pending" | "in_progress", alasan?: string): Promise<PicDetailApi> {
  const { data } = await api.post<{ data: PicDetailApi }>(`/api/pic/permintaan/${id}/status`, { status, alasan: alasan?.trim() || undefined });
  return data.data;
}

/** POST /api/pic/permintaan/{id}/kirim-hasil (multipart): 1 sampai 5 bukti. */
export async function kirimHasilTiket(id: number | string, bukti: File[], catatan?: string): Promise<PicDetailApi> {
  const form = new FormData();
  for (const berkas of bukti) form.append("bukti[]", berkas);
  if (catatan?.trim()) form.append("catatan", catatan.trim());
  const { data } = await api.post<{ data: PicDetailApi }>(`/api/pic/permintaan/${id}/kirim-hasil`, form);
  return data.data;
}

/* ---------- Laporan pribadi ---------- */

export interface FilterLaporanPic {
  /** Tanggal pengajuan, format YYYY-MM-DD (kedua ujung ikut dihitung). */
  dari?: string;
  sampai?: string;
  /** Section asal karyawan pengaju. */
  id_bagian_pengaju?: number;
}

export interface LaporanPicApi {
  total: number;
  per_status: Record<StatusApi, number>;
  per_kategori: { kategori: string; jumlah: number }[];
  per_bagian_pengaju: { id: number | null; nama_bagian: string; jumlah: number }[];
  top_layanan: { id: number; nama_layanan: string; jumlah: number; selesai: number; rata_rata_jam: number | null }[];
  selesai: { jumlah: number; rata_rata_jam: number | null; tanpa_revisi_persen: number | null };
  /** Tidak terpengaruh filter: tiket baru di section PIC yang masih menunggu keputusan. */
  antrean_saat_ini: number;
}

/** GET /api/pic/laporan: statistik atas tiket yang PIC ini tangani sendiri. */
export async function getLaporanPic(params: FilterLaporanPic = {}): Promise<LaporanPicApi> {
  const { data } = await api.get<{ data: LaporanPicApi }>("/api/pic/laporan", { params });
  return data.data;
}

/** GET /api/pic/laporan/ekspor: tiket yang PIC ini tangani (sesuai filter) sebagai berkas CSV. */
export function unduhLaporanPicCsv(params: FilterLaporanPic = {}): Promise<{ blob: Blob; nama: string }> {
  return unduhBerkas("/api/pic/laporan/ekspor", params, "laporan-pic.csv");
}
