"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, type LucideIcon } from "lucide-react";

/** Menutup overlay dengan tombol Escape selama overlay terbuka. */
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
export function usePortalReady() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function Modal({ open, onClose, children, maxWidth = "max-w-md" }: { open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  useEsc(open, onClose);
  const ready = usePortalReady();
  if (!open || !ready) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="ui-backdrop absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" onClick={onClose} />
      <div className={`ui-modal relative bg-white rounded-xl shadow-2xl w-full ${maxWidth} border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col`}>{children}</div>
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
