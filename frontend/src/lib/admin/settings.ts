/**
 * Pembantu halaman Settings Admin. Data pengaturan diambil dari API (lib/api/admin.ts) dan profil
 * dari sesi login (useAuth); berkas ini hanya memuat konstanta tampilan dan penilai kata sandi.
 */

/** Nomor tiket dibuat otomatis per section: {KODE SECTION}-{TAHUN}-{URUTAN 4 digit}, contoh GA-2026-0001. */
export const CONTOH_NOMOR_TIKET = [
  { kode: "GA", section: "General Affairs", contoh: "GA-2026-0001" },
  { kode: "HR", section: "Human Resource", contoh: "HR-2026-0001" },
  { kode: "IS", section: "Information System", contoh: "IS-2026-0001" },
  { kode: "PE", section: "Production Engineering", contoh: "PE-2026-0001" },
  { kode: "ASM", section: "Assembly", contoh: "ASM-2026-0001" },
] as const;

/** Skor kekuatan kata sandi 0–4 (hanya petunjuk visual; aturan sebenarnya ditegakkan server). */
export function kekuatanPassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}
