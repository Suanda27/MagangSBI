/** Nama ikon tampilan section. Dipetakan ke ikon lucide oleh components/employee/section-icon. */
export type IconName = "precision_manufacturing" | "groups" | "apartment" | "account_tree" | "computer";

/** Ikon tampilan per kode section (bagians.kode_bagian). Data lain datang dari API. */
const IKON: Record<string, IconName> = {
  PE: "precision_manufacturing",
  HR: "groups",
  GA: "apartment",
  ASM: "account_tree",
  IS: "computer",
};

export const ikonSection = (kode: string): IconName => IKON[kode.toUpperCase()] ?? "apartment";

/** Bagian URL untuk section: kode huruf kecil, mis. "ga". */
export const slugSection = (kode: string): string => kode.toLowerCase();
