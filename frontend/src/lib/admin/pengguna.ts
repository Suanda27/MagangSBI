import type { Role } from "@/lib/api/types";
import { toApiError } from "@/lib/api/errors";

/** Peran yang dapat ditetapkan Admin, beserta penjelasan hak aksesnya. */
export const ROLE_OPSI: { value: Role; label: string; deskripsi: string }[] = [
  { value: "employee", label: "Karyawan", deskripsi: "Karyawan mengajukan tiket layanan, memantau perkembangan permintaannya sendiri, lalu meninjau hasil kerja PIC (setujui atau minta revisi)." },
  { value: "pic", label: "PIC", deskripsi: "PIC menerima tiket dari antrean section-nya, memperbarui progres, dan mengirim hasil kerja untuk ditinjau karyawan. Satu PIC terikat ke satu section." },
  { value: "supervisor", label: "Supervisor", deskripsi: "Supervisor memantau seluruh tiket yang ditujukan ke section-nya dan melihat laporan section tersebut." },
  { value: "admin", label: "Admin", deskripsi: "Administrator mengelola master data (pengguna, section, layanan, lokasi), pemetaan PIC, dan pengaturan sistem. Tidak terikat ke section." },
];

export const ROLE_LABEL: Record<Role, string> = { employee: "Karyawan", pic: "PIC", supervisor: "Supervisor", admin: "Admin" };

export const ROLE_BADGE: Record<Role, string> = {
  employee: "bg-slate-100 text-slate-700",
  pic: "bg-blue-50 text-blue-700",
  supervisor: "bg-purple-50 text-purple-700",
  admin: "bg-slate-900 text-white",
};

export const ROLE_AVATAR: Record<Role, string> = {
  employee: "bg-slate-100 text-slate-600 border border-slate-200",
  pic: "bg-blue-100 text-blue-700 border border-blue-200",
  supervisor: "bg-purple-100 text-purple-700 border border-purple-200",
  admin: "bg-slate-800 text-white",
};

/** Peran selain admin wajib terikat ke satu section. */
export const butuhSection = (role: Role) => role !== "admin";

/** Hasil aksi seperti pada dialog master data: sukses, atau pesan galat (422 per field atau pesan umum). */
export type HasilAksi = { ok: true } | { ok: false; error: string };

export function keHasil(error: unknown): HasilAksi {
  const e = toApiError(error);
  return { ok: false, error: Object.values(e.errors)[0]?.[0] ?? e.message };
}
