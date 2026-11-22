"use client";

import { PRIORITAS_API, STATUS_API, type PrioritasApi, type StatusApi } from "@/lib/shared/status";

/**
 * Badge status tiket untuk data berbentuk API (submitted, in_progress, ...).
 * perspektif="karyawan" memakai istilah karyawan (mis. "Diajukan" untuk status submitted).
 */
export function StatusTiketBadge({ status, perspektif = "umum" }: { status: StatusApi; perspektif?: "umum" | "karyawan" }) {
  const m = STATUS_API[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {perspektif === "karyawan" ? m.labelKaryawan : m.label}
    </span>
  );
}

export function PrioritasTiketBadge({ prioritas }: { prioritas: PrioritasApi }) {
  const m = PRIORITAS_API[prioritas];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${m.badge}`}>{m.label}</span>;
}
