/**
 * Model pengaturan Administrator. Disimpan di localStorage selama endpoint belum tersedia.
 * Saat API Laravel siap: GET/PATCH /api/admin/settings (ganti isi `loadSettings` / `saveSettings`).
 */

export interface AdminSettings {
  profil: { nama: string; email: string; telepon: string; jabatan: string };
  keamanan: { minPassword: number; timeoutMenit: number; wajib2fa: boolean };
  sistem: {
    namaAplikasi: string;
    namaPerusahaan: string;
    zonaWaktu: "Asia/Jakarta" | "Asia/Makassar" | "Asia/Jayapura";
    formatTanggal: "DD MMM YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    bahasa: "id" | "en";
    maintenance: boolean;
  };
  tiket: {
    maksUploadMb: number;
    format: { jpg: boolean; png: boolean; pdf: boolean };
  };
  /** Notifikasi hanya di dalam aplikasi (keputusan PRD D8), tanpa email. */
  notifikasi: Record<NotifKey, { inapp: boolean }>;
}

export type NotifKey = "tiketBaru" | "statusBerubah" | "hasilDikirim" | "tiketDitolak" | "penggunaBaru";

export const NOTIF_LABEL: Record<NotifKey, { judul: string; desc: string }> = {
  tiketBaru: { judul: "Tiket baru dibuat", desc: "Karyawan mengajukan permintaan layanan baru." },
  statusBerubah: { judul: "Status tiket berubah", desc: "PIC menerima atau menunda tiket, dan pengaju menyetujui hasilnya." },
  hasilDikirim: { judul: "Hasil dikirim untuk ditinjau", desc: "PIC mengirim hasil kerja, atau pengaju meminta revisi." },
  tiketDitolak: { judul: "Tiket ditolak PIC", desc: "PIC menolak tiket beserta alasannya." },
  penggunaBaru: { judul: "Pengguna baru ditambahkan", desc: "Akun baru dibuat pada menu Pengguna." },
};

export const DEFAULT_SETTINGS: AdminSettings = {
  profil: { nama: "Admin ISM", email: "admin.ism@sbi.co.id", telepon: "+62 812-0000-1234", jabatan: "Administrator Sistem" },
  keamanan: { minPassword: 8, timeoutMenit: 30, wajib2fa: false },
  sistem: {
    namaAplikasi: "ISM System",
    namaPerusahaan: "PT Sumitomo Wiring Systems Batam Indonesia",
    zonaWaktu: "Asia/Jakarta",
    formatTanggal: "DD MMM YYYY",
    bahasa: "id",
    maintenance: false,
  },
  tiket: {
    maksUploadMb: 5,
    format: { jpg: true, png: true, pdf: true },
  },
  notifikasi: {
    tiketBaru: { inapp: true },
    statusBerubah: { inapp: true },
    hasilDikirim: { inapp: true },
    tiketDitolak: { inapp: true },
    penggunaBaru: { inapp: true },
  },
};

export const STORAGE_KEY = "ism.admin.settings.v2";

/** Gabungkan data tersimpan dengan default agar field baru tidak hilang. */
export function loadSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      profil: { ...DEFAULT_SETTINGS.profil, ...s.profil },
      keamanan: { ...DEFAULT_SETTINGS.keamanan, ...s.keamanan },
      sistem: { ...DEFAULT_SETTINGS.sistem, ...s.sistem },
      tiket: { ...DEFAULT_SETTINGS.tiket, ...s.tiket, format: { ...DEFAULT_SETTINGS.tiket.format, ...s.tiket?.format } },
      notifikasi: { ...DEFAULT_SETTINGS.notifikasi, ...s.notifikasi },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AdminSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage terblokir/penuh */
  }
}

/** Nomor tiket dibuat otomatis per section: {KODE SECTION}-{TAHUN}-{URUTAN 4 digit}, contoh GA-2026-0001. */
export const CONTOH_NOMOR_TIKET = [
  { kode: "GA", section: "General Affairs", contoh: "GA-2026-0001" },
  { kode: "HR", section: "Human Resource", contoh: "HR-2026-0001" },
  { kode: "IS", section: "Information System", contoh: "IS-2026-0001" },
  { kode: "PE", section: "Production Engineering", contoh: "PE-2026-0001" },
  { kode: "ASM", section: "Assembly", contoh: "ASM-2026-0001" },
] as const;

/** Skor kekuatan kata sandi 0–4. */
export function kekuatanPassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}
