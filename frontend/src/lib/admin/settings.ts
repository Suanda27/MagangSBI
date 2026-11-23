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
    prefix: string;
    sertakanTahun: boolean;
    panjangNomor: number;
    slaMendesak: number;
    slaTinggi: number;
    slaNormal: number;
    peringatanSla: number;
    maksUploadMb: number;
    format: { jpg: boolean; png: boolean; pdf: boolean };
  };
  notifikasi: Record<NotifKey, { inapp: boolean; email: boolean }> & { ringkasanHarian: boolean };
}

export type NotifKey = "tiketBaru" | "statusBerubah" | "slaMendekati" | "tiketDitolak" | "penggunaBaru";

export const NOTIF_LABEL: Record<NotifKey, { judul: string; desc: string }> = {
  tiketBaru: { judul: "Tiket baru dibuat", desc: "Karyawan mengajukan permintaan layanan baru." },
  statusBerubah: { judul: "Status tiket berubah", desc: "PIC menerima, menunda, atau menyelesaikan tiket." },
  slaMendekati: { judul: "SLA mendekati batas", desc: "Tiket hampir atau sudah melewati batas SLA." },
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
    prefix: "SRV",
    sertakanTahun: true,
    panjangNomor: 4,
    slaMendesak: 6,
    slaTinggi: 12,
    slaNormal: 24,
    peringatanSla: 80,
    maksUploadMb: 5,
    format: { jpg: true, png: true, pdf: true },
  },
  notifikasi: {
    tiketBaru: { inapp: true, email: true },
    statusBerubah: { inapp: true, email: false },
    slaMendekati: { inapp: true, email: true },
    tiketDitolak: { inapp: true, email: false },
    penggunaBaru: { inapp: true, email: false },
    ringkasanHarian: false,
  },
};

export const STORAGE_KEY = "ism.admin.settings.v1";

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

/** Contoh nomor tiket sesuai konfigurasi, untuk pratinjau. */
export function contohNomorTiket(t: AdminSettings["tiket"], tahun = 2026) {
  const prefix = t.prefix.trim().toUpperCase() || "TKT";
  const nomor = String(42).padStart(Math.max(3, Math.min(8, t.panjangNomor)), "0");
  return [prefix, t.sertakanTahun ? String(tahun) : null, nomor].filter(Boolean).join("-");
}

/** Skor kekuatan kata sandi 0–4. */
export function kekuatanPassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s;
}
