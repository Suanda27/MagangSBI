"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, PlusCircle, MoreVertical, Eye, Pencil, Trash2, CheckCircle2, Cog, Wind, Wrench as WrenchIcon, Scale } from "lucide-react";

type Layanan = {
  code: string;
  name: string;
  category: string;
  section: string;
  desc: string;
  total: number;
  status: "Aktif" | "Nonaktif";
  icon: typeof Cog;
  iconClass: string;
};

const layananList: Layanan[] = [
  { code: "SRV-001", name: "Sensor & Otomasi", category: "Peralatan & Otomasi", section: "Assembly", desc: "Penanganan gangguan pada sensor proximity, limit switch, sensor optik, dan integrasi PLC.", total: 32, status: "Aktif", icon: Cog, iconClass: "bg-blue-50 text-blue-700" },
  { code: "SRV-002", name: "Perbaikan AC", category: "Fasilitas & Gedung", section: "GA", desc: "Service chiller & split unit AC, perbaikan pipa freon, pembersihan filter udara.", total: 28, status: "Aktif", icon: Wind, iconClass: "bg-sky-50 text-sky-600" },
  { code: "SRV-003", name: "Perbaikan Peralatan", category: "Maintenance & Perbaikan", section: "PE", desc: "Kalibrasi dan perbaikan fixture kerja, alat press hidrolik, dan peralatan mekanik produksi.", total: 24, status: "Aktif", icon: WrenchIcon, iconClass: "bg-indigo-50 text-indigo-600" },
  { code: "SRV-004", name: "Kalibrasi Timbangan Digital", category: "Maintenance & Perbaikan", section: "PE", desc: "Pengecekan akurasi timbangan analitik, sertifikasi berkala instrumen ukur bobot material.", total: 6, status: "Nonaktif", icon: Scale, iconClass: "bg-slate-100 text-slate-500" },
];

export default function LayananPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 tracking-wider uppercase mb-1">
            <span>Master Data</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Konfigurasi Katalog Layanan</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Semua Layanan</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola seluruh layanan internal untuk karyawan dan konfigurasi penugasan operasional.</p>
        </div>
        <Link href="/admin/layanan/tambah" className="px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center gap-2 shadow-sm transition-all shrink-0">
          <PlusCircle className="w-4 h-4" />
          Tambah Layanan
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Layanan", value: 32, sub: "Tersebar di 5 Section Operasional" },
          { label: "Layanan Aktif", value: 29, sub: "90.6% siap digunakan di formulir tiket" },
          { label: "Layanan Nonaktif", value: 3, sub: "Status arsip atau konfigurasi draft" },
          { label: "Total Permintaan", value: 186, sub: "+18.4% bln ini" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{c.label}</span>
            <div className="mt-3 text-2xl font-bold text-slate-900">{c.value}</div>
            <div className="mt-2 text-xs text-slate-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" placeholder="Cari nama layanan, deskripsi, atau section..." type="text" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select className="text-xs border border-slate-200 rounded-lg py-2 px-3 text-slate-700 bg-white hover:bg-slate-50 focus:outline-none">
            <option value="">Semua Section</option>
            <option>Assembly</option>
            <option>HR</option>
            <option>IS</option>
            <option>PE</option>
            <option>GA</option>
          </select>
          <select className="text-xs border border-slate-200 rounded-lg py-2 px-3 text-slate-700 bg-white hover:bg-slate-50 focus:outline-none">
            <option value="">Semua Status</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
          <button className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Reset filter">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-5">Nama Layanan</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-center">Section</th>
                <th className="py-3.5 px-4 max-w-xs">Deskripsi</th>
                <th className="py-3.5 px-4 text-center">Permintaan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {layananList.map((l) => (
                <tr key={l.code} className={`hover:bg-slate-50 transition-colors ${l.status === "Nonaktif" ? "opacity-80" : ""}`}>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.iconClass}`}>
                        <l.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{l.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{l.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{l.category}</td>
                  <td className="py-3.5 px-4 text-center"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">{l.section}</span></td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={l.desc}>{l.desc}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-slate-800">{l.total}</span>
                    <span className="text-[11px] text-slate-400 block">tiket</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {l.status === "Aktif" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right relative">
                    <button className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setOpenMenu(openMenu === l.code ? null : l.code)}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === l.code && (
                      <div className="absolute right-5 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-30 text-left">
                        <button className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"><Eye className="w-4 h-4 text-slate-400" /> Lihat Detail</button>
                        <button className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50"><Pencil className="w-4 h-4 text-slate-400" /> Edit Layanan</button>
                        <div className="border-t border-slate-100 my-1"></div>
                        {l.status === "Aktif" ? (
                          <button className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4 text-rose-500" /> Hapus Layanan</button>
                        ) : (
                          <button className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-emerald-600 hover:bg-emerald-50"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Aktifkan Layanan</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>Menampilkan <span className="font-semibold text-slate-700">1–4</span> dari <span className="font-semibold text-slate-700">32</span> layanan</div>
          <div className="flex items-center gap-1.5">
            <button className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-medium shadow-xs">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">2</button>
          </div>
        </div>
      </div>
    </>
  );
}
