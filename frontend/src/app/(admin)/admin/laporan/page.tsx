"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Filter, Check, RotateCcw, ChevronDown } from "lucide-react";

const recap = [
  { id: "GA-2026-0064", title: "Perbaikan AC Ruang Server Line 2", layanan: "Perbaikan AC", requester: "Muhammad Faiz", section: "Assembly", pic: "Budi Santoso", plant: "Plant 2", status: "Selesai", tglAjuan: "25 Feb 2026, 08:30", tglSelesai: "25 Feb 2026, 11:45" },
  { id: "PE-2026-0063", title: "Penggantian Sensor Pneumatik Press 04", layanan: "Penggantian Komponen", requester: "Agus Pramono", section: "PE", pic: "Rizky Pratama", plant: "Plant 1", status: "Sedang Diproses", tglAjuan: "25 Feb 2026, 09:10", tglSelesai: "-" },
  { id: "IS-2026-0062", title: "Koneksi Switch Hub Kantor HR Drop", layanan: "Dukungan Sistem", requester: "Dewi Rahayu", section: "HR", pic: "Belum Ditugaskan", plant: "Plant 1", status: "Menunggu", tglAjuan: "25 Feb 2026, 10:00", tglSelesai: "-" },
  { id: "PE-2026-0061", title: "Pengadaan Spare Valve Hidrolik Kompresor", layanan: "Penggantian Komponen", requester: "Irfan Setiawan", section: "Assembly", pic: "Hendra Wijaya", plant: "Plant 3", status: "Pending", tglAjuan: "24 Feb 2026, 14:15", tglSelesai: "-" },
  { id: "PE-2026-0060", title: "Kalibrasi Timbangan Digital Loading Dock", layanan: "Kalibrasi Mesin", requester: "Tri Nugroho", section: "PE", pic: "Siti Aminah", plant: "Plant 2", status: "Selesai", tglAjuan: "24 Feb 2026, 11:20", tglSelesai: "24 Feb 2026, 16:00" },
  { id: "GA-2026-0059", title: "Pemasangan Terminal Listrik Pribadi Locker", layanan: "Instalasi Listrik", requester: "Rendi Kurnia", section: "GA", pic: "Budi Santoso", plant: "Plant 1", status: "Ditolak", tglAjuan: "24 Feb 2026, 09:40", tglSelesai: "24 Feb 2026, 10:15" },
];

const statusStyle: Record<string, string> = {
  Selesai: "bg-slate-100 text-slate-900",
  "Sedang Diproses": "bg-blue-50 text-blue-700",
  Menunggu: "bg-slate-100 text-slate-500",
  Pending: "bg-amber-50 text-amber-700",
  Ditolak: "bg-rose-50 text-rose-700",
};

export default function LaporanPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [periode, setPeriode] = useState("Bulan ini");

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-sm text-slate-500 mt-1">Lihat rekapitulasi permintaan layanan internal.</p>
        </div>
        <div className="relative">
          <button onClick={() => setExportOpen(!exportOpen)} className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-800 transition-all">
            <Download className="w-[18px] h-[18px]" /> Export Laporan <ChevronDown className="w-[18px] h-[18px]" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl z-50 p-1.5 flex flex-col border border-slate-200">
              <div className="px-3 py-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">Pilih Format Berkas</div>
              <button className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><FileText className="w-[18px] h-[18px]" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">Export PDF</span>
                  <span className="text-xs text-slate-500">Unduh dokumen format .pdf siap cetak</span>
                </div>
              </button>
              <button className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><FileSpreadsheet className="w-[18px] h-[18px]" /></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900">Export Excel</span>
                  <span className="text-xs text-slate-500">Unduh lembar kerja spreadsheet .xlsx</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Permintaan", value: 64, sub: "Tiket dalam periode terpilih" },
          { label: "Menunggu", value: 12, sub: "18.7% belum ditangani petugas" },
          { label: "Sedang Diproses", value: 28, sub: "43.8% aktif dikerjakan PIC" },
          { label: "Selesai", value: 21, sub: "32.8% telah tuntas diselesaikan" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-2">
            <span className="text-[11px] uppercase text-slate-500 tracking-wider font-semibold">{c.label}</span>
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{c.value}</span>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-semibold text-slate-900">Filter Laporan</h2>
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1">
            {["Hari ini", "Minggu ini", "Bulan ini", "Tahun ini", "Custom"].map((p) => (
              <button key={p} onClick={() => setPeriode(p)} className={`px-3 py-1 text-xs rounded transition-colors ${periode === p ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-slate-500 hover:text-slate-900"}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Section", options: ["Semua Section", "Assembly", "HR", "IS", "PE", "GA"] },
            { label: "Layanan", options: ["Semua Layanan", "Perbaikan AC", "Penggantian Komponen", "Kalibrasi Mesin Press"] },
            { label: "PIC", options: ["Semua PIC", "Budi Santoso", "Siti Aminah", "Rizky Pratama"] },
            { label: "Plant", options: ["Semua Plant", "Plant 1", "Plant 2", "Plant 3"] },
            { label: "Status", options: ["Semua Status", "Menunggu", "Sedang Diproses", "Pending", "Selesai", "Ditolak"] },
          ].map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{f.label}</label>
              <select className="w-full bg-slate-50 text-slate-900 text-sm rounded-lg px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-700/20 transition-all outline-none cursor-pointer">
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-medium">
            <RotateCcw className="w-4 h-4" /> Reset Filter
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-opacity text-xs font-medium shadow-sm">
            <Check className="w-4 h-4" /> Terapkan Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Status Permintaan</h3>
            <p className="text-xs text-slate-500">Distribusi tiket per tahap penanganan</p>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
            <div className="bg-blue-700" style={{ width: "43.8%" }} />
            <div className="bg-blue-400" style={{ width: "32.8%" }} />
            <div className="bg-amber-300" style={{ width: "18.7%" }} />
            <div className="bg-rose-500" style={{ width: "4.7%" }} />
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm">
            {[
              { label: "Diproses", value: 28, pct: "43.8%", color: "bg-blue-700" },
              { label: "Selesai", value: 21, pct: "32.8%", color: "bg-blue-400" },
              { label: "Menunggu", value: 12, pct: "18.7%", color: "bg-amber-300" },
              { label: "Lainnya", value: 3, pct: "4.7%", color: "bg-rose-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${s.color}`} /><span className="text-slate-900">{s.label}</span></div>
                <span className="text-xs font-semibold text-slate-900">{s.value} <span className="text-slate-400 font-normal">({s.pct})</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Permintaan Section</h3>
            <p className="text-xs text-slate-500">Unit kerja pengaju servis terbanyak</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Assembly", count: 24, pct: 75, color: "bg-blue-700" },
              { label: "PE (Production Eng.)", count: 16, pct: 50, color: "bg-slate-500" },
              { label: "GA (General Affairs)", count: 12, pct: 37.5, color: "bg-slate-500" },
              { label: "IS (Info System)", count: 8, pct: 25, color: "bg-slate-300" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-900 font-medium">{s.label}</span>
                  <span className="text-xs text-slate-900">{s.count} tiket</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`${s.color} h-full rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Top Layanan</h3>
            <p className="text-xs text-slate-500">Jenis perbaikan dan permintaan tertinggi</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { rank: 1, label: "Perbaikan AC", count: 18 },
              { rank: 2, label: "Penggantian Komponen", count: 14 },
              { rank: 3, label: "Kalibrasi Mesin Press", count: 11 },
              { rank: 4, label: "Dukungan Sistem / VPN", count: 9 },
            ].map((s) => (
              <div key={s.rank} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-900">{s.rank}</span>
                  <span className="text-sm font-medium text-slate-900">{s.label}</span>
                </div>
                <span className="text-xs font-semibold text-blue-700">{s.count} req</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Rekapitulasi Permintaan</h2>
            <p className="text-xs text-slate-500">Daftar rincian tiket layanan yang tercatat dalam periode laporan.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-slate-500 text-xs">Read-only report</span>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-slate-900">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2 font-semibold">ID Permintaan</th>
                <th className="px-4 py-2 font-semibold min-w-[200px]">Judul Permintaan</th>
                <th className="px-4 py-2 font-semibold">Layanan</th>
                <th className="px-4 py-2 font-semibold">Pengaju</th>
                <th className="px-4 py-2 font-semibold">Section</th>
                <th className="px-4 py-2 font-semibold">PIC</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Tanggal Ajuan</th>
                <th className="px-4 py-2 font-semibold">Tanggal Selesai</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {recap.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-blue-700">#{r.id}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.title}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.layanan}</td>
                  <td className="px-4 py-2.5 text-slate-700">{r.requester}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.section}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.pic}</td>
                  <td className="px-4 py-2.5"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{r.tglAjuan}</td>
                  <td className="px-4 py-2.5 text-slate-700 text-xs font-medium">{r.tglSelesai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm text-slate-500">Menampilkan <span className="font-semibold text-slate-900">1–6</span> dari <span className="font-semibold text-slate-900">64</span> permintaan</span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded bg-blue-700 text-white text-xs font-semibold flex items-center justify-center shadow-xs">1</button>
            <button className="w-8 h-8 rounded hover:bg-slate-200 text-xs flex items-center justify-center transition-colors">2</button>
            <button className="w-8 h-8 rounded hover:bg-slate-200 text-xs flex items-center justify-center transition-colors">3</button>
          </div>
        </div>
      </div>
    </>
  );
}
