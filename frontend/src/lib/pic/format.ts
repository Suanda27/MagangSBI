/**
 * Format dan aturan tampilan yang khusus modul PIC (status lokal PIC dan prioritas).
 * Helper umum (tanggal, ukuran berkas, inisial, useNow, validasi lampiran) ada di lib/shared/format.
 * Tanpa SLA (keputusan PRD D1): prioritas hanya label.
 */

import type { StatusPermintaan } from "./types";

export const STATUS_META: Record<StatusPermintaan, { label: string; badge: string; dot: string; bar: string }> = {
  menunggu: { label: "Menunggu Pemeriksaan", badge: "bg-amber-50 text-amber-700 border-amber-200/70", dot: "bg-amber-500", bar: "bg-amber-500" },
  diproses: { label: "Sedang Diproses", badge: "bg-blue-50 text-blue-700 border-blue-200/70", dot: "bg-blue-500", bar: "bg-blue-600" },
  pending: { label: "Pending", badge: "bg-violet-50 text-violet-700 border-violet-200/70", dot: "bg-violet-500", bar: "bg-violet-500" },
  menunggu_konfirmasi: { label: "Menunggu Konfirmasi", badge: "bg-sky-50 text-sky-700 border-sky-200/70", dot: "bg-sky-500", bar: "bg-sky-500" },
  selesai: { label: "Selesai", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  ditolak: { label: "Ditolak", badge: "bg-rose-50 text-rose-700 border-rose-200/70", dot: "bg-rose-500", bar: "bg-rose-500" },
};

export const PRIORITAS_META = {
  Mendesak: "bg-rose-50 text-rose-700 border-rose-200/70",
  Tinggi: "bg-orange-50 text-orange-700 border-orange-200/70",
  Normal: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

/** Hari kerja (Senin–Jumat). Tanggal libur nasional belum diperhitungkan (asumsi PRD A-hari-kerja). */
export function tambahHariKerja(iso: string, hari: number): string {
  const d = new Date(iso);
  let sisa = hari;
  while (sisa > 0) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) sisa--;
  }
  return d.toISOString();
}

/** Tiket ditutup otomatis bila karyawan tidak menanggapi dalam jumlah hari kerja ini. */
export const TUTUP_OTOMATIS_HARI_KERJA = 3;
