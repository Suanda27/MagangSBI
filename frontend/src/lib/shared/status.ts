/**
 * Status dan prioritas tiket dalam bentuk yang dikirim API (sama dengan enum backend
 * App\Enums\StatusPermintaan dan App\Enums\Prioritas). Dipakai semua peran begitu halaman
 * disambungkan ke API; sampai saat itu modul PIC masih memakai nama lokalnya sendiri.
 */

export type StatusApi = "submitted" | "in_progress" | "pending" | "waiting_review" | "completed" | "rejected";
export type PrioritasApi = "normal" | "tinggi" | "mendesak";

interface MetaStatus {
  /** Label umum (sudut pandang PIC / Admin / Supervisor) */
  label: string;
  /** Label dari sudut pandang karyawan pengaju */
  labelKaryawan: string;
  badge: string;
  dot: string;
}

export const STATUS_API: Record<StatusApi, MetaStatus> = {
  submitted: { label: "Menunggu Pemeriksaan", labelKaryawan: "Diajukan", badge: "bg-amber-50 text-amber-700 border-amber-200/70", dot: "bg-amber-500" },
  in_progress: { label: "Sedang Diproses", labelKaryawan: "Sedang Diproses", badge: "bg-blue-50 text-blue-700 border-blue-200/70", dot: "bg-blue-500" },
  pending: { label: "Pending", labelKaryawan: "Pending", badge: "bg-violet-50 text-violet-700 border-violet-200/70", dot: "bg-violet-500" },
  waiting_review: { label: "Menunggu Konfirmasi", labelKaryawan: "Menunggu Konfirmasi Anda", badge: "bg-sky-50 text-sky-700 border-sky-200/70", dot: "bg-sky-500" },
  completed: { label: "Selesai", labelKaryawan: "Selesai", badge: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500" },
  rejected: { label: "Ditolak", labelKaryawan: "Ditolak", badge: "bg-rose-50 text-rose-700 border-rose-200/70", dot: "bg-rose-500" },
};

/** Status yang belum final (masih berjalan). */
export const STATUS_BERJALAN: StatusApi[] = ["submitted", "in_progress", "pending", "waiting_review"];

/** Status final: tidak dapat diubah lagi. */
export const STATUS_FINAL: StatusApi[] = ["completed", "rejected"];

export const PRIORITAS_API: Record<PrioritasApi, { label: string; badge: string }> = {
  normal: { label: "Normal", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  tinggi: { label: "Tinggi", badge: "bg-orange-50 text-orange-700 border-orange-200/70" },
  mendesak: { label: "Mendesak", badge: "bg-rose-50 text-rose-700 border-rose-200/70" },
};
