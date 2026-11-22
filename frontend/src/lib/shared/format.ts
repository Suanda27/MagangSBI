"use client";

/**
 * Helper umum (tidak terikat modul/peran): format tanggal & ukuran berkas, inisial nama,
 * waktu sekarang di klien, dan validasi lampiran. Dipakai Karyawan, PIC, Supervisor, dan Admin.
 */

import { useEffect, useState } from "react";

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

/** Aturan lampiran (PRD): JPG, PNG, PDF, maksimal 5 MB per berkas. Server tetap memvalidasi ulang. */
export const LAMPIRAN_MAKS = 5 * 1024 * 1024;
export const LAMPIRAN_TIPE = ["image/jpeg", "image/png", "application/pdf"];

export function validasiFile(f: File): string | null {
  if (!LAMPIRAN_TIPE.includes(f.type)) return `${f.name}: format harus JPG, PNG, atau PDF.`;
  if (f.size > LAMPIRAN_MAKS) return `${f.name}: ukuran melebihi 5 MB.`;
  return null;
}
