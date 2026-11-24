import type { StatusTiket } from "@/lib/api/types";

/** Warna lencana tiap status tiket dari API (6 status sesuai PRD 4.1). */
export const STATUS_TIKET_STYLE: Record<StatusTiket, { badge: string; dot: string }> = {
  submitted: { badge: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  in_progress: { badge: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  pending: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  waiting_review: { badge: "bg-violet-50 text-violet-700 border-violet-100", dot: "bg-violet-500" },
  completed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  rejected: { badge: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
};

/** Tahap 1-4 untuk indikator kemajuan (bukan persentase karangan): diajukan, diproses, konfirmasi, selesai. */
export function tahapTiket(status: StatusTiket): number {
  switch (status) {
    case "submitted":
      return 1;
    case "in_progress":
    case "pending":
      return 2;
    case "waiting_review":
      return 3;
    default:
      return 4;
  }
}

export const JUMLAH_TAHAP = 4;
