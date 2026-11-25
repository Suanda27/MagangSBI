import { api } from "./client";
import type { AksiRiwayat, Prioritas, StatusTiket } from "./types";

// Daftar, detail, dan tinjau hasil kerja untuk karyawan (PRD 6.3). Semua melempar ApiError saat gagal.

export interface BerkasLampiran {
  id: number;
  nama_file: string;
  tipe_file: string;
  ukuran_file: number;
  url: string;
}

export interface RiwayatItem {
  id: number;
  aksi: AksiRiwayat;
  judul: string;
  status: StatusTiket;
  /** Nama pelaku, atau "Sistem". */
  pelaku: string;
  keterangan: string | null;
  waktu: string | null;
}

/** Satu baris pada daftar Permintaan Saya. */
export interface PermintaanItem {
  id: number;
  kode_tiket: string;
  judul: string;
  deskripsi: string;
  status: StatusTiket;
  status_label: string;
  prioritas: Prioritas;
  prioritas_label: string;
  layanan?: { id: number; nama_layanan: string; kategori: string };
  bagian?: { id: number; kode_bagian: string; nama_bagian: string };
  lokasi: { plant?: string; lantai?: string; detail: string | null };
  dibuat_pada: string | null;
}

export interface PermintaanDetail extends PermintaanItem {
  pic?: { id: number; name: string } | null;
  /** Lampiran pengajuan saja; bukti PIC ada di hasil_kerja. */
  lampiran: BerkasLampiran[];
  hasil_kerja: {
    catatan: string | null;
    dikirim_pada: string | null;
    putaran: { putaran: number; berkas: BerkasLampiran[] }[];
  };
  alasan_tolak: string | null;
  alasan_pending: string | null;
  alasan_revisi: string | null;
  jumlah_revisi: number;
  diterima_pada: string | null;
  ditolak_pada: string | null;
  selesai_pada: string | null;
  /** True hanya saat Menunggu Konfirmasi: tombol Sesuai dan Perlu Revisi boleh tampil. */
  bisa_ditinjau: boolean;
  /** Urut dari yang paling lama. */
  riwayat: RiwayatItem[];
}

export interface Halaman<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
}

export interface FilterPermintaan {
  /** Satu status, atau kosong untuk semua. */
  status?: StatusTiket | "";
  q?: string;
  page?: number;
  per_page?: number;
}

/** GET /api/employee/permintaan: tiket milik sendiri, terbaru lebih dulu. */
export async function getDaftarPermintaan(filter: FilterPermintaan = {}): Promise<Halaman<PermintaanItem>> {
  const params: Record<string, string | number> = {};
  if (filter.status) params.status = filter.status;
  if (filter.q?.trim()) params.q = filter.q.trim();
  if (filter.page && filter.page > 1) params.page = filter.page;
  if (filter.per_page) params.per_page = filter.per_page;

  const { data } = await api.get<Halaman<PermintaanItem>>("/api/employee/permintaan", { params });
  return data;
}

/** GET /api/employee/permintaan/{id}: detail, riwayat, lampiran, dan hasil kerja PIC. */
export async function getDetailPermintaan(id: number | string): Promise<PermintaanDetail> {
  const { data } = await api.get<{ data: PermintaanDetail }>(`/api/employee/permintaan/${id}`);
  return data.data;
}

/** POST .../setujui: hasil sesuai, tiket Selesai (final). Mengembalikan detail terbaru. */
export async function setujuiHasil(id: number | string): Promise<PermintaanDetail> {
  const { data } = await api.post<{ data: PermintaanDetail }>(`/api/employee/permintaan/${id}/setujui`);
  return data.data;
}

/** POST .../revisi: hasil belum sesuai; alasan minimal 10 karakter. Tiket kembali Sedang Diproses. */
export async function mintaRevisi(id: number | string, alasan: string): Promise<PermintaanDetail> {
  const { data } = await api.post<{ data: PermintaanDetail }>(`/api/employee/permintaan/${id}/revisi`, { alasan: alasan.trim() });
  return data.data;
}

/**
 * GET /api/lampiran/{id} sebagai blob, memakai sesi login (axios) sehingga sesi habis (401) ditangani
 * seperti biasa. Hasilnya diunduh atau dibuka di tab baru.
 */
export async function ambilLampiran(berkas: BerkasLampiran, mode: "unduh" | "buka"): Promise<void> {
  const { data } = await api.get<Blob>(`/api/lampiran/${berkas.id}`, { responseType: "blob" });
  const blob = new Blob([data], { type: berkas.tipe_file });
  const url = URL.createObjectURL(blob);

  if (mode === "buka") {
    window.open(url, "_blank", "noopener");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = berkas.nama_file;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Beri waktu tab baru atau unduhan memakai blob sebelum dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
