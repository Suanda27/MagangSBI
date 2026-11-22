"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CheckCircle2, ChevronDown, Download, FileSpreadsheet, FileText, FolderOpen, Filter, PauseCircle, RotateCcw, Timer, RefreshCw } from "lucide-react";
import { CountUp, FxCard } from "@/components/fx/motion";
import PageHeader from "@/components/supervisor/page-header";
import ReadOnlyBadge from "@/components/supervisor/read-only-badge";
import { DonutChart, HBarList, TrendBars } from "@/components/supervisor/charts";
import { REPORT, SUP_SECTIONS } from "@/lib/supervisor-data";

const dl = (ms: number) => ({ "--delay": `${ms}ms` } as React.CSSProperties);

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

export default function LaporanPage() {
  const [period, setPeriod] = useState("Bulan Ini (Agustus 2026)");
  const [section, setSection] = useState("Semua Section");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const services = useMemo(
    () => REPORT.perService.filter((s) => section === "Semua Section" || s.section === section),
    [section],
  );
  const sections = useMemo(
    () => REPORT.perSection.filter((s) => section === "Semua Section" || s.label === section),
    [section],
  );

  const donutTotal = REPORT.status.reduce((a, b) => a + b.value, 0);
  const get = (l: string) => REPORT.status.find((s) => s.label === l)?.value ?? 0;

  const cards = [
    { label: "Total Permintaan", value: REPORT.total, note: `Seluruh tiket periode ${REPORT.period}`, icon: FolderOpen, tone: "text-blue-700 bg-blue-50" },
    { label: "Selesai", value: get("Selesai"), note: "Tingkat penyelesaian 68.8%", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Sedang Diproses", value: get("Diproses"), note: "Dalam penanganan teknisi PIC", icon: RefreshCw, tone: "text-indigo-600 bg-indigo-50" },
    { label: "Pending", value: get("Pending"), note: "Menunggu suku cadang / vendor", icon: PauseCircle, tone: "text-amber-600 bg-amber-50" },
  ];

  const exportExcel = () => {
    const head = ["Layanan", "Section", "Total", "Selesai", "Rata-rata Resolusi"];
    const body = services.map((s) => [s.service, s.section, s.total, s.selesai, s.avg]);
    const csv = [head, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-permintaan-${REPORT.period.replace(" ", "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportPdf = () => {
    setExportOpen(false);
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <PageHeader title="Laporan & Rekapitulasi Layanan" description="Analisis performa penanganan layanan internal, kepatuhan waktu, dan volume tiket per departemen.">
        <ReadOnlyBadge label="Supervisor (Read-Only)" />
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="group fx-shine inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 text-white text-[13px] font-medium shadow-sm shadow-blue-800/30 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />Export Laporan
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${exportOpen ? "rotate-180" : ""}`} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-20">
              <button onClick={exportPdf} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-900"><FileText className="w-4 h-4 text-rose-500" />Download PDF</button>
              <button onClick={exportExcel} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-slate-700 hover:bg-blue-50 hover:text-blue-900"><FileSpreadsheet className="w-4 h-4 text-emerald-600" />Download Excel (CSV)</button>
            </div>
          )}
        </div>
      </PageHeader>

      {/* Filter */}
      <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm print:hidden" style={dl(60)}>
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><Filter className="w-4 h-4 text-blue-700" />Filter Parameter Laporan</div>
          <span className="text-xs text-slate-400">Parameter aktif: <span className="font-medium text-slate-600">{REPORT.period}</span></span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Select label="Periode Waktu" value={period} onChange={setPeriod} options={["Hari Ini", "Minggu Ini", "Bulan Ini (Agustus 2026)", "Tahun Ini (2026)"]} />
          <Select label="Section / Divisi" value={section} onChange={setSection} options={["Semua Section", ...SUP_SECTIONS]} />
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <button onClick={() => { setSection("Semua Section"); setPeriod("Bulan Ini (Agustus 2026)"); }} className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[13px] font-medium text-slate-700 hover:border-blue-200 hover:text-blue-900">
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover:-rotate-180" />Reset
          </button>
        </div>
      </section>

      {/* Kartu */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <FxCard key={c.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-slate-500">{c.label}</span>
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.tone}`}><c.icon className="w-[18px] h-[18px]" /></span>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-900"><CountUp value={c.value} delay={200 + i * 90} /></div>
            <p className="mt-1 text-xs text-slate-400">{c.note}</p>
          </FxCard>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi status */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(200)}>
          <div className="flex items-start justify-between">
            <div><h2 className="text-[15px] font-semibold text-slate-900">Permintaan Berdasarkan Status</h2><p className="text-xs text-slate-400 mt-0.5">Distribusi proporsi pengerjaan tiket</p></div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{REPORT.period}</span>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
            <DonutChart data={REPORT.status} centerLabel="Total Tiket" />
            <ul className="flex-1 w-full grid gap-3">
              {REPORT.status.map((s) => (
                <li key={s.label} className="flex items-center justify-between text-[13px]">
                  <span className="inline-flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>
                  <span className="font-medium text-slate-800">{s.value} <span className="text-slate-400 font-normal">({((s.value / donutTotal) * 100).toFixed(1)}%)</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-[13px]">
            <span className="inline-flex items-center gap-2 text-emerald-800"><Timer className="w-4 h-4" />Kepatuhan SLA</span>
            <span className="font-semibold text-emerald-700">{REPORT.slaCompliance}% Tepat Waktu</span>
          </div>
        </section>

        {/* Per section */}
        <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(280)}>
          <div className="flex items-start justify-between">
            <div><h2 className="text-[15px] font-semibold text-slate-900">Volume Permintaan per Section</h2><p className="text-xs text-slate-400 mt-0.5">Perbandingan beban layanan antar divisi</p></div>
            <BarChart3 className="w-5 h-5 text-slate-300" />
          </div>
          <div className="mt-6" key={section}>
            <HBarList data={sections} />
          </div>
        </section>
      </div>

      {/* Tren */}
      <section className="fx-reveal rounded-xl border border-slate-200 bg-white shadow-sm p-5" style={dl(340)}>
        <div className="flex items-start justify-between mb-6">
          <div><h2 className="text-[15px] font-semibold text-slate-900">Tren Permintaan Mingguan</h2><p className="text-xs text-slate-400 mt-0.5">Permintaan masuk dibandingkan dengan yang diselesaikan</p></div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{REPORT.period}</span>
        </div>
        <TrendBars data={REPORT.trend} />
      </section>

      {/* Rekap per layanan */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div><h2 className="text-[15px] font-semibold text-slate-900">Rekapitulasi per Layanan</h2><p className="text-xs text-slate-400 mt-0.5">Volume dan performa penyelesaian tiap layanan</p></div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{services.length} layanan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] min-w-[640px]">
            <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-medium">Layanan</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium text-right">Selesai</th>
                <th className="px-5 py-3 font-medium w-48">Tingkat Selesai</th>
                <th className="px-5 py-3 font-medium text-right">Rata-rata Resolusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => {
                const pct = Math.round((s.selesai / s.total) * 100);
                return (
                  <tr key={s.service}>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{s.service}</td>
                    <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{s.section}</span></td>
                    <td className="px-5 py-3.5 text-right text-slate-700">{s.total}</td>
                    <td className="px-5 py-3.5 text-right text-slate-700">{s.selesai}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="fx-bar h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500" style={{ width: `${pct}%`, ...dl(300) }} /></div>
                        <span className="text-xs font-medium text-slate-600 w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{s.avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {services.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Tidak ada data untuk section ini.</p>}
      </section>
    </>
  );
}
