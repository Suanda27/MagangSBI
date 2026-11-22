"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { inisial } from "@/lib/shared/format";

/** Mengatur jeda animasi bertahap lewat variabel CSS --delay (dipakai kelas fx-reveal). */
export const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as React.CSSProperties;

export function Avatar({ nama, size = "sm" }: { nama: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-14 h-14 text-lg" : size === "md" ? "w-9 h-9 text-xs" : "w-6 h-6 text-[10px]";
  return (
    <span className={`${dim} rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 font-semibold flex items-center justify-center shrink-0 ring-1 ring-blue-100`}>
      {inisial(nama)}
    </span>
  );
}

/** Judul halaman dengan breadcrumb opsional dan area aksi di kanan. */
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
