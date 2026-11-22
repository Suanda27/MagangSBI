"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, PlusSquare, RefreshCw, Search, SearchX, XCircle } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import { HISTORY, type HistoryItem } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

const STYLE: Record<HistoryItem["status"], { icon: typeof CheckCircle2; ring: string; badge: string }> = {
  Selesai: { icon: CheckCircle2, ring: "bg-emerald-50 text-emerald-600 border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  Diproses: { icon: RefreshCw, ring: "bg-blue-50 text-blue-600 border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-100" },
  Ditolak: { icon: XCircle, ring: "bg-rose-50 text-rose-600 border-rose-200", badge: "bg-rose-50 text-rose-700 border-rose-100" },
  Dibuat: { icon: PlusSquare, ring: "bg-amber-50 text-amber-600 border-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-100" },
};

const selectCls =
  "appearance-none h-10 pl-3 pr-9 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300";

export default function RiwayatPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Semua Status");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HISTORY.filter(
      (h) => (status === "Semua Status" || h.status === status) && (!q || h.id.toLowerCase().includes(q) || h.title.toLowerCase().includes(q)),
    );
  }, [query, status]);

  return (
    <>
      <PageHeader title="Riwayat" description="Lacak semua aktivitas permintaan layanan Anda.">
        <div className="group/search relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari ID atau aktivitas..."
            className="h-10 w-44 sm:w-56 focus:sm:w-64 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-500"
          />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            {["Semua Status", "Selesai", "Diproses", "Ditolak", "Dibuat"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </PageHeader>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 sm:p-7">
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">Tidak ada aktivitas ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci.</p>
          </div>
        ) : (
          <ol className="relative ml-5 border-l-2 border-slate-100 space-y-7">
            {items.map((h, i) => {
              const s = STYLE[h.status];
              const Icon = s.icon;
              return (
                <li key={h.id + h.title} className="fx-reveal-x relative pl-8" style={dl(80 + i * 90)}>
                  <span className={`absolute -left-[19px] top-0 w-9 h-9 rounded-full border-2 ring-4 ring-white flex items-center justify-center ${s.ring}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <Link
                    href={`/employee/permintaan-saya/${h.id}`}
                    className="group block rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-medium text-slate-500">{h.id}</span>
                        <span className="text-slate-400">{h.at}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11.5px] font-medium ${s.badge}`}>{h.status}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 group-hover:text-blue-900">{h.title}</h3>
                    <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{h.desc}</p>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
