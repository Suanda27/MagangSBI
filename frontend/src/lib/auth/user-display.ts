import type { User } from "@/lib/api/types";

/** Inisial dari nama, maksimal dua huruf: "Syifa Fitria Azizah" -> "SF". */
export function initialsOf(name: string | null | undefined): string {
  const kata = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "?";
  return kata
    .slice(0, 2)
    .map((k) => k[0].toUpperCase())
    .join("");
}

/** Nama panggilan (kata pertama): "Syifa Fitria Azizah" -> "Syifa". */
export function firstNameOf(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "";
}

/** "2026-11-22T11:20:00+00:00" -> "22 Nov 2026" (zona waktu lokal browser). */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "-";
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return "-";
  return tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Nama section akun, atau "-" bila tidak punya (mis. Admin). */
export function sectionOf(user: Pick<User, "bagian">): string {
  return user.bagian?.nama_bagian ?? "-";
}

/** "2026-11-24T14:45:07+07:00" -> "24 Nov 2026, 14.45" (zona waktu lokal browser). */
export function formatTanggalWaktu(iso: string | null | undefined): string {
  if (!iso) return "-";
  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return "-";
  return tanggal.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** 7 -> "7 jam", 30.5 -> "1 hari 6,5 jam", null -> "Belum ada data". */
export function formatDurasiJam(jam: number | null | undefined): string {
  if (jam === null || jam === undefined) return "Belum ada data";
  if (jam < 24) return `${String(jam).replace(".", ",")} jam`;
  const hari = Math.floor(jam / 24);
  const sisa = Math.round((jam - hari * 24) * 10) / 10;
  return sisa > 0 ? `${hari} hari ${String(sisa).replace(".", ",")} jam` : `${hari} hari`;
}
