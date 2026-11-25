import { api } from "./client";

/** Notifikasi dalam aplikasi milik akun yang sedang masuk (semua peran). Kontrak: NotifikasiController. */

export interface NotifikasiApi {
  id: string;
  /** Jenis kejadian, mis. "submitted", "result_sent", "auto_closed". */
  aksi: string | null;
  judul: string;
  pesan: string;
  id_permintaan: number | null;
  kode_tiket: string | null;
  dibaca: boolean;
  dibaca_pada: string | null;
  dibuat_pada: string;
}

export interface DaftarNotifikasi {
  data: NotifikasiApi[];
  /** Jumlah SELURUH notifikasi yang belum dibaca (bukan hanya halaman ini). */
  belum_dibaca: number;
}

/** GET /api/notifikasi: terbaru dulu. */
export async function getNotifikasi(perPage = 10): Promise<DaftarNotifikasi> {
  const { data } = await api.get<DaftarNotifikasi>("/api/notifikasi", { params: { per_page: perPage } });
  return { data: data.data, belum_dibaca: data.belum_dibaca };
}

/** POST /api/notifikasi/baca: tandai satu atau beberapa notifikasi (atau semuanya) sebagai dibaca. */
export async function tandaiDibaca(target: { ids: string[] } | { semua: true }): Promise<number> {
  const { data } = await api.post<{ data: { diubah: number; belum_dibaca: number } }>("/api/notifikasi/baca", target);
  return data.data.belum_dibaca;
}
