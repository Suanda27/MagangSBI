"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, Info, X, type LucideIcon } from "lucide-react";
import { inisial, PRIORITAS_META, STATUS_META } from "@/lib/pic/format";
import { usePicStore } from "@/lib/pic/store";
import type { Prioritas, StatusPermintaan } from "@/lib/pic/types";

export const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

/* ---------- Badge ---------- */

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

export function Avatar({ nama, size = "sm" }: { nama: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14 text-lg" : size === "md" ? "w-9 h-9 text-xs" : "w-6 h-6 text-[10px]";
  return (
    <span className={`${dim} rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 font-semibold flex items-center justify-center shrink-0 ring-1 ring-blue-100`}>
      {inisial(nama)}
    </span>
  );
}

/* ---------- Header halaman ---------- */

export function PageHeader({
  title,
  desc,
  crumbs,
  actions,
}: {
  title: string;
  desc?: string;
  crumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-subtle pb-5">
      <div className="min-w-0">
        {crumbs && (
          <nav className="flex items-center gap-1.5 text-[12px] text-slate-400 mb-2">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                {c.href ? (
                  <Link href={c.href} className="hover:text-blue-700 transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-600">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {desc && <p className="text-sm text-slate-500 mt-1">{desc}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* ---------- Kartu statistik ---------- */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "blue" | "amber" | "emerald" | "rose" | "violet" | "slate";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

/* ---------- Form kontrol ---------- */

export function SelectField({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-slate-200 text-xs text-slate-700 py-2 pl-3 pr-8 rounded-lg hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
    </div>
  );
}

/* ---------- Kosong ---------- */

export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">{desc}</p>
    </div>
  );
}

/* ---------- Pagination ---------- */

export function Pagination({ page, perPage, total, onPage, noun = "permintaan" }: { page: number; perPage: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  return (
    <div className="px-5 py-3 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
      <div>
        Menampilkan <span className="font-semibold text-slate-700">{from}–{to}</span> dari <span className="font-semibold text-slate-700">{total}</span> {noun}
      </div>
      <div className="flex items-center gap-1">
        <button className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Sebelumnya">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${n === page ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {n}
          </button>
        ))}
        <button className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Selanjutnya">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Overlay: Modal & Drawer ---------- */

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

const noopSubscribe = () => () => {};
/** true hanya di klien (portal memakai document.body) tanpa setState di effect. */
function usePortalReady() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function Modal({ open, onClose, children, maxWidth = "max-w-md" }: { open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  useEsc(open, onClose);
  const ready = usePortalReady();
  if (!open || !ready) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="pic-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" onClick={onClose} />
      <div className={`pic-modal relative bg-white rounded-xl shadow-2xl w-full ${maxWidth} border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col`}>{children}</div>
    </div>,
    document.body,
  );
}

export function ModalHeader({ icon: Icon, tone, title, onClose }: { icon: LucideIcon; tone: "emerald" | "rose" | "blue" | "violet"; title: string; onClose: () => void }) {
  const t = { emerald: "bg-emerald-100 text-emerald-700", rose: "bg-rose-100 text-rose-700", blue: "bg-blue-100 text-blue-700", violet: "bg-violet-100 text-violet-700" }[tone];
  return (
    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
      <div className="flex items-center gap-3">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center ${t}`}>
          <Icon className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <button className="text-slate-400 hover:text-slate-700 hover:rotate-90 transition-all duration-300 p-1" onClick={onClose} aria-label="Tutup">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Drawer selalu ter-mount agar transisi geser masuk/keluar halus. */
export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEsc(open, onClose);
  const ready = usePortalReady();
  if (!ready) return null;
  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!open}
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}

/* ---------- Toast ---------- */

export function Toaster() {
  const { toasts, dismissToast } = usePicStore();
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
          <div key={t.id} className="pic-toast relative overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 flex gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color[t.tone]}`}>
              <I className="w-4 h-4 pic-check" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900">{t.title}</p>
              {t.desc && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>}
            </div>
            <button className="text-slate-300 hover:text-slate-600 self-start" onClick={() => dismissToast(t.id)} aria-label="Tutup">
              <X className="w-3.5 h-3.5" />
            </button>
            <span className={`pic-progress absolute bottom-0 left-0 h-0.5 w-full ${bar[t.tone]}`} />
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
