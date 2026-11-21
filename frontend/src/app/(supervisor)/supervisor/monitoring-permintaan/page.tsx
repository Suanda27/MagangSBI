"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw, Search, SearchX, RefreshCw } from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import TicketTable from "@/components/supervisor/ticket-table";
import { SUP_PICS, SUP_SECTIONS, SUP_STATUSES, SUP_TICKETS } from "@/lib/supervisor-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);
const PER_PAGE = 6;
const PERIODS = ["Bulan Ini", "Minggu Ini", "Hari Ini"];
const TODAY = "24 Agu 2026";

const selectCls =
  "w-full appearance-none h-10 pl-3 pr-9 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300";

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("Semua Status");
  const [section, setSection] = useState("Semua Section");
  const [pic, setPic] = useState("Semua PIC");
  const [period, setPeriod] = useState("Bulan Ini");
  const [page, setPage] = useState(1);

  const reset = () => {
    setQ(""); setStatus("Semua Status"); setSection("Semua Section"); setPic("Semua PIC"); setPeriod("Bulan Ini"); setPage(1);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SUP_TICKETS.filter(
      (t) =>
        (!s || t.id.toLowerCase().includes(s) || t.title.toLowerCase().includes(s) || t.requester.toLowerCase().includes(s)) &&
        (status === "Semua Status" || t.status === status) &&
        (section === "Semua Section" || t.section === section) &&
        (pic === "Semua PIC" || (pic === "Belum Ditugaskan" ? !t.pic : t.pic === pic)) &&
        (period !== "Hari Ini" || t.date === TODAY),
    );
  }, [q, status, section, pic, period]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const count = (s: string) => SUP_TICKETS.filter((t) => t.status === s).length;

  const stats = [
    { label: "Total Dipantau", value: SUP_TICKETS.length, tone: "text-blue-700 bg-blue-50" },
    { label: "Baru Diajukan", value: count("Baru"), tone: "text-sky-600 bg-sky-50" },
    { label: "Sedang Diproses", value: count("Diproses"), tone: "text-indigo-600 bg-indigo-50" },
    { label: "Selesai", value: count("Selesai"), tone: "text-emerald-600 bg-emerald-50" },
    { label: "Pending", value: count("Pending"), tone: "text-amber-600 bg-amber-50" },
  ];

  return (
    <>
      <PageHeader title="Monitoring Permintaan" description="Pantau status dan perkembangan seluruh permintaan layanan internal dalam cakupan supervisi Anda.">
        <ReadOnlyBadge label="Supervisor (Read-Only)" />
      </PageHeader>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <FxCard key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[12px] font-medium text-slate-500">{s.label}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-2xl font-semibold tracking-tight text-slate-900"><CountUp value={s.value} delay={150 + i * 80} /></span>
              <span className={`w-2.5 h-2.5 rounded-full ${s.tone.split(" ")[1]} ring-4 ring-white`} />
            </div>
          </FxCard>
        ))}
      </section>

      {/* Filter */}
      <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm" style={dl(120)}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><Filter className="w-4 h-4 text-blue-700" />Filter Pengawasan Permintaan</div>
          <span className="text-xs text-slate-400 hidden sm:block">Cakupan Divisi ISM & Operasional</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1 sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Pencarian</label>
            <div className="group/search relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none transition-colors group-focus-within/search:text-blue-600" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="ID, judul, atau pengaju..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-[13px] placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
              />
            </div>
          </div>
          <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={["Semua Status", ...SUP_STATUSES]} />
          <Select label="Section" value={section} onChange={(v) => { setSection(v); setPage(1); }} options={["Semua Section", ...SUP_SECTIONS]} />
          <Select label="PIC" value={pic} onChange={(v) => { setPic(v); setPage(1); }} options={["Semua PIC", ...SUP_PICS, "Belum Ditugaskan"]} />
          <Select label="Periode" value={period} onChange={(v) => { setPeriod(v); setPage(1); }} options={PERIODS} />
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <button onClick={reset} className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-180" />Reset Filter
          </button>
        </div>
      </section>

      {/* Tabel */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-semibold text-slate-900">Daftar Tiket Permintaan</h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{filtered.length} Tiket Terdata</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><RefreshCw className="w-3.5 h-3.5" />Pembaruan otomatis real-time</span>
        </div>

        {rows.length > 0 ? (
          <TicketTable rows={rows} />
        ) : (
          <div className="py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 mb-3"><SearchX className="w-7 h-7" /></div>
            <p className="text-sm font-medium text-slate-700">Tidak ada tiket yang sesuai</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah atau reset filter pencarian.</p>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Menampilkan {filtered.length === 0 ? 0 : (current - 1) * PER_PAGE + 1} - {Math.min(current * PER_PAGE, filtered.length)} dari {filtered.length} tiket</span>
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
