"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, type LucideIcon } from "lucide-react";

export const inputCls =
  "w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 disabled:bg-slate-50 disabled:text-slate-500";

/** Kartu seksi dengan header ikon, mengikuti gaya form admin lain. */
export function SectionCard({ icon: Icon, title, desc, children, footer }: { icon: LucideIcon; title: string; desc?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {desc && <p className="text-xs text-slate-500">{desc}</p>}
          </div>
        </div>
        {children}
      </div>
      {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">{footer}</div>}
    </section>
  );
}

export function Field({ label, hint, error, required, children, className = "" }: { label: string; hint?: string; error?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? <span className="text-[11px] text-rose-600 fx-reveal">{error}</span> : hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
    </div>
  );
}

/** Switch dengan transisi geser halus. */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50 ${checked ? "bg-blue-700" : "bg-slate-300"}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

export function ToggleRow({ title, desc, checked, onChange, tone }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; tone?: "warn" }) {
  return (
    <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors duration-300 ${tone === "warn" && checked ? "border-amber-300 bg-amber-50/60" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/* ---------- Toast ringan (berdiri sendiri untuk modul admin) ---------- */

export interface ToastItem {
  id: number;
  tone: "success" | "error";
  title: string;
  desc?: string;
}

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = (t: Omit<ToastItem, "id">) => {
    const id = ++seq.current;
    setItems((c) => [...c, { ...t, id }]);
    setTimeout(() => setItems((c) => c.filter((x) => x.id !== id)), 4000);
  };
  const dismiss = (id: number) => setItems((c) => c.filter((x) => x.id !== id));
  return { items, push, dismiss };
}

export function Toasts({ items, dismiss }: { items: ToastItem[]; dismiss: (id: number) => void }) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed top-20 right-5 z-[70] flex flex-col gap-2.5 w-[min(92vw,340px)]">
      {items.map((t) => (
        <div key={t.id} className="fx-pop-toast bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 flex gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {t.tone === "success" ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-900">{t.title}</p>
            {t.desc && <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>}
          </div>
          <button className="text-slate-300 hover:text-slate-600 self-start" onClick={() => dismiss(t.id)} aria-label="Tutup">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
