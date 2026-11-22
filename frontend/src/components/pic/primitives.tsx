"use client";

/**
 * Komponen yang khusus modul PIC (terikat status dan store PIC).
 * Komponen netral (Modal, Drawer, Pagination, SelectField, EmptyState, Avatar, dan lain-lain)
 * ada di components/shared.
 */

import { ToastStack } from "@/components/shared/toast";
import { PRIORITAS_META, STATUS_META } from "@/lib/pic/format";
import { usePicStore } from "@/lib/pic/store";
import type { Prioritas, StatusPermintaan } from "@/lib/pic/types";

export function StatusBadge({ status }: { status: StatusPermintaan }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function PrioritasBadge({ prioritas }: { prioritas: Prioritas }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${PRIORITAS_META[prioritas]}`}>{prioritas}</span>;
}

/** Toaster modul PIC: membaca toast dari store PIC dan menampilkannya lewat ToastStack bersama. */
export function Toaster() {
  const { toasts, dismissToast } = usePicStore();
  return <ToastStack toasts={toasts} onDismiss={dismissToast} />;
}
