/**
 * Format dan aturan tampilan yang khusus modul PIC (status lokal PIC, prioritas, dan SLA).
 * Helper umum (tanggal, ukuran berkas, inisial, useNow, validasi lampiran) ada di lib/shared/format.
 *
 * Catatan: SLA dihapus pada PRD final (keputusan D1) dan dibersihkan pada penyesuaian frontend Sprint 2.
 */

import type { Permintaan, StatusPermintaan } from "./types";

export const STATUS_META: Record<StatusPermintaan, { label: string; badge: string; dot: string; bar: string }> = {
  menunggu: { label: "Menunggu Pemeriksaan", badge: "bg-amber-50 text-amber-700 border-amber-200/70", dot: "bg-amber-500", bar: "bg-amber-500" },
  diproses: { label: "Sedang Diproses", badge: "bg-blue-50 text-blue-700 border-blue-200/70", dot: "bg-blue-500", bar: "bg-blue-600" },
  pending: { label: "Pending", badge: "bg-violet-50 text-violet-700 border-violet-200/70", dot: "bg-violet-500", bar: "bg-violet-500" },
  selesai: { label: "Selesai", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  ditolak: { label: "Ditolak", badge: "bg-rose-50 text-rose-700 border-rose-200/70", dot: "bg-rose-500", bar: "bg-rose-500" },
};

export const PRIORITAS_META = {
  Mendesak: "bg-rose-50 text-rose-700 border-rose-200/70",
  Tinggi: "bg-orange-50 text-orange-700 border-orange-200/70",
  Normal: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export type SlaInfo = { label: string; tone: "ok" | "warn" | "late" | "none" };

/** Sisa waktu SLA. Permintaan yang sudah final tidak memiliki hitung mundur. */
export function infoSla(p: Pick<Permintaan, "slaDeadline" | "status">, now: number | null): SlaInfo {
  if (p.status === "selesai" || p.status === "ditolak") return { label: "—", tone: "none" };
  if (now === null) return { label: "…", tone: "none" };
  const sisa = new Date(p.slaDeadline).getTime() - now;
  const abs = Math.abs(sisa);
  const j = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  const teks = j >= 24 ? `${Math.floor(j / 24)} hr ${j % 24} jam` : j > 0 ? `${j} jam ${m} mnt` : `${m} mnt`;
  if (sisa < 0) return { label: `Terlambat ${teks}`, tone: "late" };
  if (sisa < 4 * 3600_000) return { label: `${teks} lagi`, tone: "warn" };
  return { label: `${teks} lagi`, tone: "ok" };
}

export const SLA_TONE = {
  ok: "text-slate-600",
  warn: "text-amber-700",
  late: "text-rose-700",
  none: "text-slate-400",
} as const;
