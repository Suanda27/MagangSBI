"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, PlusCircle, Search, SearchX } from "lucide-react";
import PageHeader from "@/components/employee/page-header";
import StatusBadge from "@/components/employee/status-badge";
import { TICKETS, type TicketStatus } from "@/lib/employee-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);
const TABS: ("Semua" | TicketStatus)[] = ["Semua", "Diajukan", "Diproses", "Selesai", "Ditolak"];
const PER_PAGE = 4;

export default function PermintaanSayaPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Semua");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TICKETS.filter(
      (t) =>
        (tab === "Semua" || t.status === tab) &&
        (!q || t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.service.toLowerCase().includes(q)),
    );
  }, [tab, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const countOf = (t: (typeof TABS)[number]) => (t === "Semua" ? TICKETS.length : TICKETS.filter((x) => x.status === t).length);

  return (
    <>
      <PageHeader title="Permintaan Saya" description="Kelola dan pantau status permintaan layanan Anda.">
        <Link
          href="/employee/pengajuan-layanan"
          className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
        >
          <PlusCircle className="w-[17px] h-[17px] transition-transform duration-500 group-hover:rotate-90" />
          Buat Permintaan Baru
        </Link>
      </PageHeader>

      <section className="fx-reveal flex flex-col lg:flex-row lg:items-center justify-between gap-4" style={dl(80)}>
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-300 ${
                tab === t ? "bg-blue-700 text-white shadow-sm shadow-blue-700/30" : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"
              }`}
            >
              {t}
              <span className={`ml-1.5 text-[11px] ${tab === t ? "text-blue-100" : "text-slate-400"}`}>{countOf(t)}</span>
            </button>
          ))}
        </div>

        <div className="group/search relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Cari permintaan..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-[13px] placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[720px]">
            <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Judul</th>
                <th className="px-5 py-3 font-medium">Layanan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Terakhir Diperbarui</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{t.id}</td>
                  <td className="px-5 py-3.5 text-slate-800 max-w-[260px] truncate">{t.title}</td>
                  <td className="px-5 py-3.5 text-slate-600">{t.service}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500">{t.updatedAt}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/employee/permintaan-saya/${t.id}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50">
                      <Eye className="w-4 h-4" />Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">Tidak ada permintaan ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Menampilkan {filtered.length === 0 ? 0 : (current - 1) * PER_PAGE + 1} - {Math.min(current * PER_PAGE, filtered.length)} dari {filtered.length} data
          </span>
          <div className="flex items-center gap-1">
            <button disabled={current === 1} onClick={() => setPage(current - 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors ${n === current ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{n}</button>
            ))}
            <button disabled={current === pages} onClick={() => setPage(current + 1)} className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Berikutnya"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>
    </>
  );
}
