"use client";

import { useEffect, useState } from "react";
import type { Permintaan, StatusPermintaan } from "./types";

const ZONA = "Asia/Jakarta";

const fmtTanggal = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: ZONA });
const fmtJam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA });
const fmtHari = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: ZONA });

/** "17 Nov 2026" */
export const tanggal = (iso: string) => fmtTanggal.format(new Date(iso)).replace(/\./g, "");
/** "08.24" -> "08:24" */
export const jam = (iso: string) => fmtJam.format(new Date(iso)).replace(".", ":");
/** "17 Nov 2026, 08:24" */
export const tanggalJam = (iso: string) => `${tanggal(iso)}, ${jam(iso)}`;
/** Kunci hari (YYYY-MM-DD) pada zona WIB, untuk perbandingan tanggal. */
export const kunciHari = (iso: string | Date) => fmtHari.format(typeof iso === "string" ? new Date(iso) : iso);

export function ukuranFile(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

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

/** Waktu sekarang di sisi klien; null saat render server agar tidak terjadi hydration mismatch. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

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

export const LAMPIRAN_MAKS = 5 * 1024 * 1024; // 5 MB (sesuai PRD)
export const LAMPIRAN_TIPE = ["image/jpeg", "image/png", "application/pdf"];

export function validasiFile(f: File): string | null {
  if (!LAMPIRAN_TIPE.includes(f.type)) return `${f.name}: format harus JPG, PNG, atau PDF.`;
  if (f.size > LAMPIRAN_MAKS) return `${f.name}: ukuran melebihi 5 MB.`;
  return null;
}
