"use client";

import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { usePortalReady } from "./overlay";

export interface ToastData {
  id: number;
  tone: "success" | "error" | "info";
  title: string;
  desc?: string;
}

/**
 * Tampilan toast murni: tidak tahu soal store/peran mana pun.
 * Setiap modul menyediakan state-nya sendiri dan meneruskannya lewat props, mis. Toaster milik PIC.
 */
export function ToastStack({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: number) => void }) {
  const ready = usePortalReady();
  if (!ready) return null;
  const icon = { success: CheckCircle2, error: AlertCircle, info: Info };
  const color = { success: "text-emerald-600 bg-emerald-50", error: "text-rose-600 bg-rose-50", info: "text-blue-600 bg-blue-50" };
  const bar = { success: "bg-emerald-500", error: "bg-rose-500", info: "bg-blue-500" };
  return createPortal(
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2.5 w-[min(92vw,360px)]">
      {toasts.map((t) => {
        const I = icon[t.tone];
        return (
          <div key={t.id} className="ui-toast relative overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 flex gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color[t.tone]}`}>
              <I className="w-4 h-4 ui-check" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900">{t.title}</p>
              {t.desc && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>}
            </div>
            <button className="text-slate-300 hover:text-slate-600 self-start" onClick={() => onDismiss(t.id)} aria-label="Tutup">
              <X className="w-3.5 h-3.5" />
            </button>
            <span className={`ui-progress absolute bottom-0 left-0 h-0.5 w-full ${bar[t.tone]}`} />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
